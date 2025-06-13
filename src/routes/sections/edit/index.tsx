import { useStore } from '@/routes/store';
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
      footer={
        <>
          <Button type="tertiary" onClick={() => setShowEdit(false)}>
            关闭
          </Button>
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
