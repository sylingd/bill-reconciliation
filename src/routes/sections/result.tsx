import { BillTypeName } from '@/constant';
import { Button, Card, Table } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

const Result = () => {
  const { billData, loadingDiffData, diffData, setShowEdit } = useStore();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [scrollY, setScrollY] = useState(0);

  const updateScrollYRef = useRef<ReturnType<typeof requestAnimationFrame>>();
  const updateScrollY = useCallback(() => {
    if (typeof updateScrollYRef.current !== 'undefined') {
      return;
    }
    updateScrollYRef.current = requestAnimationFrame(() => {
      const dom = document.querySelector('.diff-table') as HTMLDivElement;
      setScrollY(dom.offsetHeight - 38);
      updateScrollYRef.current = undefined;
    });
  }, []);

  useEffect(() => {
    updateScrollY();
    window.addEventListener('resize', updateScrollY);
    return () => {
      window.removeEventListener('resize', updateScrollY);
    };
  }, []);

  useEffect(() => {
    updateScrollY();
  }, [diffData]);

  return (
    <Card
      title="查看结果"
      className="result-card"
      headerExtraContent={
        <Button onClick={() => setShowEdit(true)}>设置</Button>
      }
    >
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
        virtualized={{
          itemSize: 37,
        }}
        scroll={{
          y: scrollY,
        }}
        columns={[
          {
            title: '时间',
            dataIndex: 'time',
            render: v => dayjs(v * 1000).format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            title: '记账-ID',
            dataIndex: 'bill.id',
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
            title: '账单-ID',
            dataIndex: 'record.id',
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
          if (row?.score > 200) {
            return {
              className: 'diff-high',
            };
          }
          return {};
        }}
      />
    </Card>
  );
};

export default Result;
