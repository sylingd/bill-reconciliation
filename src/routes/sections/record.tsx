import {
  ArrayField,
  Button,
  Card,
  Dropdown,
  Form,
  Space,
  Spin,
  Tag,
  Tooltip,
  useFieldApi,
  useFieldState,
} from '@douyinfe/semi-ui';
import { FC } from 'react';
import { RecordStatus, useStore } from '../store';
import { recordApps } from '@/parser';

interface RecordFilePickerProps {
  field: string;
}
const RecordFilePicker: FC<RecordFilePickerProps> = ({ field }) => {
  const api = useFieldApi(field);
  const { value = {} } = useFieldState(field);
  const { file } = value;

  return (
    <Dropdown
      showArrow
      menu={recordApps.map(x => ({
        node: 'item',
        name: x.name,
        onClick: () => {
          x.picker()
            .then(f => {
              api.setValue({
                ...(api.getValue() || {}),
                file: f,
                type: x.key,
              });
            })
            .catch(() => {
              // ignore
            });
        },
      }))}
    >
      <Button style={{ width: '300px' }}>
        {file ? `已选择：${(file as File).name}` : '选择文件'}
      </Button>
    </Dropdown>
  );
};

function renderStatus(status: RecordStatus) {
  if (status === 'loading') {
    return <Spin />;
  }
  if (typeof status === 'object' && status instanceof Error) {
    return (
      <Tooltip content={status.message}>
        <Tag color="red">错误</Tag>
      </Tooltip>
    );
  }
  if (Array.isArray(status)) {
    return <Tag color="green">解析成功</Tag>;
  }
  return <Tag color="grey">未选择</Tag>;
}

const Record = () => {
  const { recordStatus, onGetFormApi, formOnChange, account } = useStore();

  return (
    <Card title="第二步：选择账单（可多选）">
      <Form onValueChange={formOnChange} getFormApi={onGetFormApi}>
        <ArrayField field="record" initValue={[{}]}>
          {({ arrayFields, addWithInitValue }) => (
            <Space vertical align="start" style={{ width: '100%' }}>
              {arrayFields.map(({ field, key, remove }, index) => (
                <Space key={key}>
                  <div style={{ width: '60px' }}>
                    {renderStatus(recordStatus[index])}
                  </div>
                  <RecordFilePicker field={field} />
                  <Form.Select
                    style={{ width: '300px' }}
                    noLabel
                    field={`${field}.account`}
                    optionList={account}
                  />
                  <Button onClick={remove}>移除</Button>
                </Space>
              ))}
              <Button onClick={() => addWithInitValue({})}>添加更多</Button>
            </Space>
          )}
        </ArrayField>
      </Form>
    </Card>
  );
};

export default Record;
