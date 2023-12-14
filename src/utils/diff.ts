import { BillType, IBillItem, IRecordItem } from "@/types";
import { Idle } from "./idle";

interface IBillDiffResult {
  score: number;
  bill?: IBillItem;
  record?: IRecordItem;
}

const MONEY_WEIGHT = 5;
const TIME_WEIGHT = 1;

// diff 前的数据预处理
export async function prepareBillRecord(accountName: string, bill: IBillItem[]) {
  const result: IRecordItem[] = [];
  const idle = new Idle();

  for (let i = 0; i < bill.length; i++) {
    if (idle.shouldIdle()) {
      await idle.sleep();
    }
    const item = bill[i];
    if (item.account1 !== accountName && item.account2 !== accountName) {
      continue;
    }
    if (item.type === BillType.INCOME || item.type === BillType.EXPENSE) {
      // 这两个只有单个账户，可以直接原样记录
      result.push({
        id: item.id,
        type: item.type,
        time: item.time,
        money: item.money,
        remark: `${item.category}-${item.remark}`
      });
    }
    // 涉及两个账户的，第一个是支出，第二个是收入
    result.push({
      id: item.id,
      type: item.account1 === accountName? BillType.EXPENSE : BillType.INCOME,
      time: item.time,
      money: item.money,
      remark: `${item.type}-${item.category}-${item.remark}`
    })
  }

  return result;
}

export function calcScore(bill: IRecordItem, record: IRecordItem) {
  if (bill.type !== record.type) {
    return Number.MAX_SAFE_INTEGER;
  }
  const moneyScore = Math.abs(Number(bill.money) - Number(record.money)) * MONEY_WEIGHT;
  const timeScore = Math.abs(bill.time - record.time) * TIME_WEIGHT;
  if (Number.isNaN(moneyScore) || Number.isNaN(timeScore)) {
    return Number.MAX_SAFE_INTEGER
  }
  return moneyScore + timeScore;
}


// 对两个数据进行 diff，产生新的数据
export function billDiff(bill: IRecordItem[], record: IRecordItem[]): IBillDiffResult[] {
  const largeRecord = bill.length > record.length ? bill : record;
  const smallRecord = largeRecord === bill ? record : bill;

  if (largeRecord.length === 0 || smallRecord.length === 0) {
    throw new Error('数据不可为空');
  }

  // 从小的开始查找，优先找到匹配度最高的
  // let lastLargeIndex = 0;
  // let lastSmallIndex = 0;
  // let lastScore = Number.MAX_SAFE_INTEGER;
  // for (let i = 0; i < smallRecord.length; i++) {
    // const smallRec = smallRecord[i];
    // TODO: 找到得分最小的几个
    // let start = 0;
    // let end = largeRecord.length - 1;
    // while (start <)
    // for (let i = lastLargeIndex; i < largeRecord.length; i++) {
    //   if ()
    // }
  // }

  return [];
}
