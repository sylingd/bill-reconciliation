import { Button, Card, Space, Spin, Tag } from '@douyinfe/semi-ui';
import { useStore } from '../store';
import { billApps } from '@/parser';

const Bill = () => {
  const { billData, loadingBillData, parseBillData } = useStore();
  return (
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
  );
};

export default Bill;
