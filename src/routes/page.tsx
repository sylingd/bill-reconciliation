import {
  Button,
  Card,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from '@douyinfe/semi-ui';
import { useRequest } from 'ahooks';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { billDiff, prepareBillRecord } from '@/utils/diff';
import { IBillAppConfig, IRecordAppConfig } from '@/types';
import { billApps, recordApps } from '@/parser';
import './index.css';
import { BillTypeName } from '@/constant';

const Index = () => {
  const [recordAccount, setRecordAccount] = useState('');

  const {
    data: billData,
    loading: loadingBillData,
    run: parseBillData,
  } = useRequest((file: File, app: IBillAppConfig) => app.parser(file), {
    manual: true,
    onSuccess: () => setRecordAccount(''),
  });

  const {
    data: recordData,
    loading: loadingRecordData,
    run: parseRecordData,
  } = useRequest(
    (file: File, app: IRecordAppConfig) => app.parser(file, recordAccount),
    {
      manual: true,
    },
  );

  const { data: diffData, loading: loadingDiffData } = useRequest(
    async () => {
      console.log('doDiff', billData, recordData);
      if (!billData || !recordData || !recordAccount) {
        return [];
      }
      const rec = await prepareBillRecord(recordAccount, billData);
      console.log('prepareBillRecord', rec);
      const res = await billDiff(rec, recordData);
      console.log('billDiff', res);
      return res;
    },
    {
      refreshDeps: [recordAccount, billData, recordData],
    },
  );

  const accounts = useMemo(() => {
    const result = new Set<string>();
    if (billData) {
      billData.forEach(x => {
        x.account1 && result.add(x.account1);
        x.account2 && result.add(x.account2);
      });
    }
    return Array.from(result).map(x => ({
      label: x,
      value: x,
    }));
  }, [billData]);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  return (
    <div>
      <Card
        title={
          <Space>
            <Tag color={billData ? 'green' : 'red'}>
              {billData ? '已' : '未'}选择
            </Tag>
            <span>第一步：选择记账软件</span>
          </Space>
        }
      >
        <Spin spinning={loadingBillData}>
          <Space>
            {billApps.map(x => (
              <Button
                key={x.key}
                onClick={async () => {
                  const f = await x.picker();
                  parseBillData(f, x);
                }}
              >
                {x.name}
              </Button>
            ))}
          </Space>
        </Spin>
      </Card>
      <Card
        title={
          <Space>
            <Tag color={recordData ? 'green' : 'red'}>
              {recordData ? '已' : '未'}选择
            </Tag>
            <span>第二步：选择导出账单</span>
            <Select
              disabled={!billData}
              placeholder="选择对应的账户名"
              value={recordAccount}
              onChange={v => setRecordAccount(v as string)}
              optionList={accounts}
            />
          </Space>
        }
      >
        <Spin spinning={loadingRecordData}>
          <Space>
            {recordApps.map(x => (
              <Button
                key={x.key}
                disabled={!billData}
                onClick={async () => {
                  const f = await x.picker();
                  parseRecordData(f, x);
                }}
              >
                {x.name}
              </Button>
            ))}
          </Space>
        </Spin>
      </Card>
      <Table
        className="diff-table"
        rowKey="id"
        loading={loadingDiffData}
        size="small"
        dataSource={diffData}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: keys => setSelectedKeys(keys as string[]),
        }}
        virtualized
        columns={[
          {
            title: '时间',
            dataIndex: 'time',
            render: v => dayjs(v * 1000).format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            title: '记账-类型',
            dataIndex: 'bill.type',
            render: (_, rec) => {
              if (!rec.bill) {
                return '';
              }
              const it = billData?.find(x => x.id === rec.bill!.id);
              return it ? BillTypeName[it.type] : '';
            },
          },
          {
            title: '记账-金额',
            dataIndex: 'bill.money',
          },
          {
            title: '记账-时间',
            dataIndex: 'bill.time',
            render: v =>
              v ? dayjs(v * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
          },
          {
            title: '记账-备注',
            dataIndex: 'bill.remark',
          },
          {
            title: '账单-类型',
            dataIndex: 'record.type',
          },
          {
            title: '账单-金额',
            dataIndex: 'record.money',
          },
          {
            title: '账单-时间',
            dataIndex: 'record.time',
            render: v =>
              v ? dayjs(v * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
          },
          {
            title: '账单-备注',
            dataIndex: 'record.remark',
          },
        ]}
        pagination={false}
        onRow={row => {
          if (!row?.bill) {
            return {
              className: 'diff-add',
            };
          }
          if (!row?.record) {
            return {
              className: 'diff-remove',
            };
          }
          return {};
        }}
      />
    </div>
  );
};

export default Index;
