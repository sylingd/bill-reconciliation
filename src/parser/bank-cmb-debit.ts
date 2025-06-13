import { BillType, type IRecordAppConfig, type IRecordItem } from '@/types';
import { loadFile, readFileText } from '@/utils/file';
import { Idle } from '@/utils/idle';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

const BankCMBDebit: IRecordAppConfig = {
  key: 'bang-cmb-debit',
  name: '招商银行借记卡',
  picker: () => loadFile('csv'),
  parser: async file => {
    const idle = new Idle();
    const content = (await readFileText(file, 'UTF-8')).trim().split('\n');
    await idle.sleep();
    const firstLineIndex = content.findIndex(x => x.includes('交易日期'));

    if (firstLineIndex === -1) {
      throw new Error('未找到开始行');
    }

    // 首行
    const firstLine = content[firstLineIndex].split(',').map(x => x.trim());
    // 找到对应的几个下标
    const findIndex = (name: string) => {
      const index = firstLine.indexOf(name);
      if (index === -1) {
        throw new Error(`未找到 ${name} 列，请检查数据`);
      }
      return index;
    };
    const incomeIndex = findIndex('收入');
    const outcomeIndex = findIndex('支出');
    const dayIndex = findIndex('交易日期');
    const timeIndex = findIndex('交易时间');
    const remarkIndex = findIndex('交易备注');

    const result: IRecordItem[] = [];

    for (let i = firstLineIndex; i < content.length; i++) {
      if (idle.shouldIdle()) {
        await idle.sleep();
      }
      if (content[i].trim() === '') {
        break;
      }
      const line = content[i]
        .split(',')
        .map(x => x.replace(/^"/, '').replace(/"$/, '').trim());
      const type = line[incomeIndex] ? BillType.INCOME : BillType.EXPENSE;
      const money = Number(
        line[type === BillType.INCOME ? incomeIndex : outcomeIndex].trim(),
      );
      const time = dayjs(
        `${line[dayIndex].trim()} ${line[timeIndex].trim()}`,
      ).unix();

      result.push({
        id: `cmb-${nanoid()}`,
        type: type,
        money: String(money),
        time: time,
        remark: line[remarkIndex].trim(),
      });
    }

    // 基于日期从大到小进行排序
    return result.sort((a, b) => b.time - a.time);
  },
};

export default BankCMBDebit;
