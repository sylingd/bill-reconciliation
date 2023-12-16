import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { BillType, IRecordItem } from '@/types';
import { loadFile, readFileText } from '@/utils/file';
import { Idle } from '@/utils/idle';

export const importBankCGBFile = () => loadFile('csv');

export async function parseBankCGBFile(file: File): Promise<IRecordItem[]> {
  const idle = new Idle();
  const content = (await readFileText(file, 'GB2312')).trim().split('\n');
  await idle.sleep();

  // 首行
  const firstLine = content[0].split(',');
  // 找到对应的几个下标
  const findIndex = (name: string) => {
    const index = firstLine.indexOf(name);
    if (index === -1) {
      throw new Error(`未找到 ${name} 列，请检查数据`);
    }
    return index;
  };
  const moneyIndex = findIndex('入账金额');
  const timeIndex = findIndex('交易日');
  const remarkIndex = findIndex('交易摘要');

  const result: IRecordItem[] = [];

  for (let i = 1; i < content.length; i++) {
    if (idle.shouldIdle()) {
      await idle.sleep();
    }
    const line = content[i].split(',');
    const money = Number(line[moneyIndex].trim());

    result.push({
      id: `cgb-${line[timeIndex].trim()}-${nanoid()}`,
      type: money > 0 ? BillType.EXPENSE : BillType.INCOME,
      money: line[moneyIndex].trim().replace(/^-/, ''),
      time: dayjs(line[timeIndex].trim()).unix(),
      remark: line[remarkIndex].trim(),
    });
  }

  // 基于日期从大到小进行排序
  return result.sort((a, b) => b.time - a.time);
}
