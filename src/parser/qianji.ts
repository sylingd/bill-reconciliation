import { BillType, type IBillAppConfig, type IBillItem } from '@/types';
import { loadFile, readFileText } from '@/utils/file';
import { Idle } from '@/utils/idle';
import dayjs from 'dayjs';

export const importQianJiFile = () => loadFile('csv');

const typeMap: Record<string, BillType> = {
  收入: BillType.INCOME,
  支出: BillType.EXPENSE,
  转账: BillType.TRANSFER,
  还款: BillType.TRANSFER,
  '债务-借入': BillType.BORROW_IN,
  '债务-借出': BillType.BORROW_OUT,
  '债务-收款': BillType.PAYBACK_IN,
  '债务-还款': BillType.PAYBACK_OUT,
};

const QianJi: IBillAppConfig = {
  key: 'qianji',
  name: '钱迹',
  picker: () => loadFile('csv'),
  parser: async file => {
    const idle = new Idle();
    const content = (await readFileText(file)).trim().split('\n');
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
    const idIndex = findIndex('DataId');
    const typeIndex = findIndex('类型');
    const moneyIndex = findIndex('金额');
    const account1Index = findIndex('账户1');
    const account2Index = findIndex('账户2');
    const timeIndex = findIndex('时间');
    const categoryIndex = findIndex('分类');
    const remarkIndex = findIndex('备注');

    const result: IBillItem[] = [];

    for (let i = 1; i < content.length; i++) {
      if (idle.shouldIdle()) {
        await idle.sleep();
      }
      const line = content[i].split(',');
      result.push({
        id: line[idIndex],
        type: typeMap[line[typeIndex]],
        money: line[moneyIndex],
        account1: line[account1Index],
        account2: line[account2Index],
        time: dayjs(line[timeIndex]).unix(),
        category: line[categoryIndex],
        remark: line[remarkIndex],
      });
    }

    // 基于日期从大到小进行排序
    return result.sort((a, b) => b.time - a.time);
  },
};

export default QianJi;
