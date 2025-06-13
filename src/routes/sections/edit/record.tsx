import { recordApps } from '@/parser';
import { IconPlusCircle } from '@douyinfe/semi-icons';
import {
  ArrayField,
  Button,
  Card,
  Divider,
  Dropdown,
  Form,
  Space,
  Spin,
  Tag,
  Tooltip,
  useFieldApi,
  useFieldState,
} from '@douyinfe/semi-ui';
import type { FC } from 'react';
import { type RecordStatus, useStore } from '../../store';

interface RecordFilePickerProps {
  field: string;
}
const RecordFilePicker: FC<RecordFilePickerProps> = ({ field }) => {
  const api = useFieldApi(field);
  const { value = {} } = useFieldState(field);
  const { file } = value;

  return (
    <Dropdown
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
      <Button className="file-picker">
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
  const { recordStatus, onGetFormApi, formOnChange, account, setRecordStatus } =
    useStore();

  return (
    <div className="section section-record">
      <Divider align="center">第二步：选择账单（可多选）</Divider>
      <Form onValueChange={formOnChange} getFormApi={onGetFormApi}>
        <ArrayField field="record" initValue={[{}]}>
          {({ arrayFields, addWithInitValue }) => (
            <Space vertical align="start" style={{ width: '100%' }}>
              {arrayFields.map(({ field, key, remove }, index) => (
                <div key={key} className="item">
                  <div style={{ width: '60px' }}>
                    {renderStatus(recordStatus[index])}
                  </div>
                  <RecordFilePicker field={field} />
                  <Form.Select
                    noLabel
                    field={`${field}.account`}
                    fieldClassName="account"
                    optionList={account}
                  />
                  <Button
                    onClick={() => {
                      remove();
                      setRecordStatus(index, null);
                    }}
                  >
                    移除
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => addWithInitValue({})}
                icon={<IconPlusCircle />}
              >
                添加更多
              </Button>
            </Space>
          )}
        </ArrayField>
      </Form>
    </div>
  );
};

export default Record;
