import { useStore } from '@/routes/store';
import { IconExternalOpen } from '@douyinfe/semi-icons';
import { Button, Divider, SideSheet, Space } from '@douyinfe/semi-ui';
import Bill from './bill';
import Record from './record';

const Edit = () => {
  const { showEdit, setShowEdit, doDiff, loadingDiffData } = useStore();

  return (
    <SideSheet
      className="edit-side-sheet"
      visible={showEdit}
      title="设置"
      width={720}
      onCancel={() => setShowEdit(false)}
      maskClosable={false}
      closeOnEsc={false}
      keepDOM
      footer={
        <>
          <Button type="tertiary" onClick={() => setShowEdit(false)}>
            关闭
          </Button>
          <a
            href="https://docs.qq.com/doc/p/d1eebeb1a081c205bce28ed16b2cd1a3d46fbddd"
            target="_blank"
            rel="noreferrer"
          >
            <Button icon={<IconExternalOpen />}>银行账单获取说明</Button>
          </a>
          <Button
            type="primary"
            theme="solid"
            onClick={doDiff}
            loading={loadingDiffData}
          >
            开始计算
          </Button>
        </>
      }
    >
      <Bill />
      <Record />
    </SideSheet>
  );
};

export default Edit;
