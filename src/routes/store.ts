import { BaseFormProps, FormApi } from '@douyinfe/semi-ui/lib/es/form';
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
import { IBillAppConfig, IRecordItem } from '@/types';
import { recordApps } from '@/parser';

interface FormValue {
  record: Array<{
    file: File;
    type: string;
    account: string;
  }>;
}

type RecordStatus = Error | IRecordItem[] | 'loading' | null;
const useModel = () => {
  const formApi = useRef<FormApi>();

  const [recordStatus, _setRecordStatus] = useState<Array<RecordStatus>>([]);
  const setRecordStatus = useCallback((index: number, value: RecordStatus) => {
    _setRecordStatus(v => {
      const newValue = [...v];
      newValue[index] = value;
      return newValue;
    });
  }, []);

  const {
    data: billData,
    loading: loadingBillData,
    run: parseBillData,
  } = useRequest((file: File, app: IBillAppConfig) => app.parser(file), {
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
    (_: any, changedValues: any) => {
      const keys = Object.keys(changedValues)
        .filter(
          x =>
            x.endsWith('.account') ||
            x.endsWith('.type') ||
            x.endsWith('.file'),
        )
        .map(x => x.match(/record\[(\d+)\]/))
        .filter(x => Boolean(x))
        .map(x => Number(x![1]));
      const changedIndex = uniq(keys);
      changedIndex.forEach(index => {
        const file = formApi.current?.getValue(`record[${index}].file`);
        const account = formApi.current?.getValue(`record[${index}].account`);
        const type = formApi.current?.getValue(`record[${index}].type`);
        const parser = recordApps.find(x => x.key === type);
        if (!file || !account || !type || !parser) {
          setRecordStatus(index, null);
          return;
        }
        setRecordStatus(index, 'loading');
        parser
          .parser(file, account)
          .then(result => setRecordStatus(index, result))
          .catch(err => setRecordStatus(index, err as Error));
      });
    },
    [],
  );

  const {
    data: diffData,
    loading: loadingDiffData,
    run: doDiff,
  } = useRequest(async () => {
    // console.log('doDiff', billData, recordData);
    // if (!billData || !recordData || !recordAccount) {
    //   return [];
    // }
    // const rec = await prepareBillRecord(recordAccount, billData);
    // console.log('prepareBillRecord', rec);
    // const res = await billDiff(rec, recordData);
    // console.log('billDiff', res);
    // return res;
  });

  return {
    formApi,
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
  };
};

const Context = createContext<ReturnType<typeof useModel>>({} as any);

const useStore = () => useContext(Context);

export { useModel, useStore, Context };
