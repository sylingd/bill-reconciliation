import { Button } from '@douyinfe/semi-ui';
import { useCallback } from 'react';
import { importBankCGBFile, parseBankCGBFile } from '@/parser/bank-cgb';
import { importQianJiFile, parseQianJiFile } from '@/parser/qianji';
import { billDiff, prepareBillRecord } from '@/utils/diff';

const Index = () => {
  const doDiff = useCallback(async () => {
    const cgbFile = await importBankCGBFile();
    const qianJiFile = await importQianJiFile();
    const cgb = await parseBankCGBFile(cgbFile);
    const qianJi = await parseQianJiFile(qianJiFile);

    const qjRec = await prepareBillRecord('广发', qianJi);

    const res = await billDiff(qjRec, cgb);
    console.log(res);
  }, []);

  return (
    <div>
      <Button onClick={doDiff}>开始</Button>
    </div>
  );
};

export default Index;
