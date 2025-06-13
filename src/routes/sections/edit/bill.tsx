import { billApps } from '@/parser';
import { Button, Card, Divider, Space, Spin, Tag } from '@douyinfe/semi-ui';
import { useStore } from '../../store';

const Bill = () => {
  const { billData, loadingBillData, parseBillData } = useStore();
  return (
    <div className="section">
      <Divider align="center">
        <Space>
          <Tag color={billData ? 'green' : 'red'}>
            {billData ? '已' : '未'}选择
          </Tag>
          <span>第一步：选择记账软件</span>
        </Space>
      </Divider>
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
    </div>
  );
};

export default Bill;
