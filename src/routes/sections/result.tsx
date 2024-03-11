import { Button, Card, Table } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useStore } from '../store';
import { BillTypeName } from '@/constant';

const Result = () => {
  const { billData, loadingDiffData, diffData, doDiff } = useStore();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  return (
    <Card title="查看结果">
      <Button onClick={doDiff}>计算结果</Button>
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
    </Card>
  );
};

export default Result;
