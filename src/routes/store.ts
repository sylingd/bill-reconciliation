import { recordApps } from '@/parser';
import type { IBillAppConfig, IRecordItem } from '@/types';
import { billDiff, prepareBillRecord } from '@/utils/diff';
import { Toast } from '@douyinfe/semi-ui';
import type { BaseFormProps, FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { useRequest } from 'ahooks';
import { uniq } from 'lodash-es';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

interface FormValue {
  record: Array<{
    file: File;
    type: string;
    account: string;
  }>;
}

export type RecordStatus = Error | IRecordItem[] | 'loading' | null;
const useModel = () => {
  const formValue = useRef<FormValue>({
    record: [],
  });
  const formApi = useRef<FormApi>();
  const onGetFormApi = useCallback(
    (api: FormApi) => (formApi.current = api),
    [],
  );

  const [showEdit, setShowEdit] = useState(true);

  const [recordStatus, _setRecordStatus] = useState<Array<RecordStatus>>([]);
  const setRecordStatus = useCallback((index: number, value: RecordStatus) => {
    _setRecordStatus(v => {
      const newValue = [...v];
      newValue[index] = value;
      return newValue;
    });
  }, []);

  // 解析出来的记账软件账单数据，只有一个文件
  const {
    data: billData,
    loading: loadingBillData,
    run: parseBillData,
  } = useRequest((input: any, app: IBillAppConfig) => app.parser(input), {
    manual: true,
    onSuccess: () => {
      const v: FormValue['record'] = formApi.current?.getValue('record');
      if (Array.isArray(v)) {
        const newValue: any = {};
        v.forEach((_, index) => (newValue[`record[${index}].account`] = ''));
        formApi.current?.setValues(newValue);
      }
    },
  });

  const [account, category] = useMemo(() => {
    const accRes = new Set<string>();
    const catRes = new Set<string>();
    if (billData) {
      billData.forEach(x => {
        x.account1 && accRes.add(x.account1);
        x.account2 && accRes.add(x.account2);
        x.category && catRes.add(x.category);
      });
    }
    const acc = Array.from(accRes).map(x => ({
      label: x,
      value: x,
    }));
    const cat = Array.from(catRes).map(x => ({
      label: x,
      value: x,
    }));
    return [acc, cat];
  }, [billData]);

  const formOnChange: BaseFormProps['onValueChange'] = useCallback(
    (values: any, changedValues: any) => {
      formValue.current = values;
      const keys = Object.keys(changedValues)
        .map(x => x.match(/record\[(\d+)\]/))
        .filter(x => Boolean(x))
        .map(x => Number(x![1]));
      const changedIndex = uniq(keys);
      changedIndex.forEach(index => {
        const { file, type } = values.record[index];
        const parser = recordApps.find(x => x.key === type);
        if (!file || !type || !parser) {
          setRecordStatus(index, null);
          return;
        }
        setRecordStatus(index, 'loading');
        parser
          .parser(file)
          .then(result => setRecordStatus(index, result))
          .catch((err: Error) => {
            Toast.error(err.message);
            console.error(err);
            setRecordStatus(index, err);
          });
      });
    },
    [],
  );

  const {
    data: diffData,
    loading: loadingDiffData,
    run: doDiff,
  } = useRequest(
    async () => {
      console.log('doDiff', billData, recordStatus);
      if (!billData) {
        throw new Error('没有记账数据');
      }
      const records = recordStatus.filter(
        x => Array.isArray(x) && x.length > 0,
      ) as Array<Array<IRecordItem>>;
      if (!billData || records.length === 0) {
        throw new Error('没有对比账单');
      }
      const accounts = (formValue.current?.record || []).map(
        (x: any) => x.account,
      );
      const rec = await prepareBillRecord(accounts, billData);
      console.log('prepareBillRecord', rec);
      const recordData = records
        .reduce((a, b) => [...a, ...b], [])
        .sort((a, b) => b.time - a.time);
      const res = await billDiff(rec, recordData);
      console.log('billDiff', res);
      return res;
    },
    {
      manual: true,
      onSuccess: () => setShowEdit(false),
      onError: e => {
        Toast.error(e.message);
        console.error(e);
      },
    },
  );

  return {
    onGetFormApi,
    formOnChange,
    recordStatus,
    setRecordStatus,
    billData,
    loadingBillData,
    parseBillData,
    diffData,
    loadingDiffData,
    doDiff,
    account,
    category,
    showEdit,
    setShowEdit,
    formValue,
  };
};

const Context = createContext<ReturnType<typeof useModel>>({} as any);

const useStore = () => useContext(Context);

export { useModel, useStore, Context };
