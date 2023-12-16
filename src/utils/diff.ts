import { Idle } from './idle';
import { findBreakPoint } from './arr';
import { BillType, IBillItem, IRecordItem } from '@/types';
import { BillTypeName } from '@/constant';

interface IBillDiffResult {
  id: string;
  score: number;
  time: number;
  bill?: IRecordItem;
  record?: IRecordItem;
}

const MONEY_WEIGHT = 5;
const TIME_WEIGHT = 1;
const MAX_SCORE = 10000;

// diff 前的数据预处理
export async function prepareBillRecord(
  accountName: string,
  bill: IBillItem[],
) {
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
        account: accountName,
        type: item.type,
        time: item.time,
        money: item.money,
        remark: `${item.category}-${item.remark}`,
      });
      continue;
    }
    // 涉及两个账户的，第一个是支出，第二个是收入
    result.push({
      id: item.id,
      type: item.account1 === accountName ? BillType.EXPENSE : BillType.INCOME,
      account: accountName,
      time: item.time,
      money: item.money,
      remark: `${BillTypeName[item.type]}-${item.category}-${item.remark}`,
    });
  }

  return result;
}

export function calcScore(bill: IRecordItem, record: IRecordItem) {
  if (bill.type !== record.type) {
    return Number.MAX_SAFE_INTEGER;
  }
  const moneyScore =
    Math.abs(Number(bill.money) - Number(record.money)) * MONEY_WEIGHT;
  const timeScore = Math.abs(bill.time - record.time) * TIME_WEIGHT;
  if (Number.isNaN(moneyScore) || Number.isNaN(timeScore)) {
    return Number.MAX_SAFE_INTEGER;
  }
  const result = moneyScore + timeScore;
  if (result > Number.MAX_SAFE_INTEGER) {
    return Number.MAX_SAFE_INTEGER;
  }
  return result;
}

const TWO_DAY_SECONDS = 172800;
// 对两个数据进行 diff，产生新的数据
export async function billDiff(
  bill: IRecordItem[],
  record: IRecordItem[],
): Promise<IBillDiffResult[]> {
  const idle = new Idle();
  const isBillLarge = bill.length > record.length;
  const largeRecord = isBillLarge ? bill : record;
  const smallRecord = isBillLarge ? record : bill;

  if (largeRecord.length === 0 || smallRecord.length === 0) {
    throw new Error('数据不可为空');
  }

  const result: IBillDiffResult[] = [];

  const matchedLargeRecord = new Set<IRecordItem>();

  // 从小的开始查找，优先找到匹配度最高的
  const largeRange = {
    start: 0,
    end: 0,
  };
  for (let i = 0; i < smallRecord.length; i++) {
    if (idle.shouldIdle()) {
      await idle.sleep();
    }
    const smallRec = smallRecord[i];
    // 只在最近两天的数据里查找
    largeRange.start = findBreakPoint(
      largeRecord,
      v => smallRec.time < TWO_DAY_SECONDS + v.time,
      largeRange.start,
    );
    largeRange.end = findBreakPoint(
      largeRecord,
      v => v.time < smallRec.time - TWO_DAY_SECONDS,
      Math.max(largeRange.start, largeRange.end),
    );
    // 找到得分最小的几个
    const recordScores = new Array(largeRange.end - largeRange.start + 1)
      .fill(null)
      .map((_, index) => {
        const rec = largeRecord[largeRange.start + index];
        // 金额完全相同，且时间差异在2m以内，可以当做完全相同
        const fullMatch =
          Number(rec.money) === Number(smallRec.money) &&
          Math.abs(rec.time - smallRec.time) <= 120;
        return {
          score: calcScore(rec, smallRec),
          fullMatch,
          record: rec,
        };
      })
      .sort((a, b) => {
        if (a.fullMatch !== b.fullMatch) {
          return a.fullMatch ? -1 : 1;
        }
        return a.score - b.score;
      });
    const firstScore = recordScores[0];
    // 如果分数太大，说明差太多了，就不要了
    if (firstScore && firstScore.score <= MAX_SCORE) {
      matchedLargeRecord.add(firstScore.record);
      result.push({
        id: `${firstScore.record.id}_${smallRec.id}`,
        score: firstScore.score,
        time: firstScore.record.time,
        [isBillLarge ? 'bill' : 'record']: firstScore.record,
        [isBillLarge ? 'record' : 'bill']: smallRec,
      });
    } else {
      // 没有匹配结果
      result.push({
        id: `~NONE~_${smallRec.id}`,
        score: Number.MAX_SAFE_INTEGER,
        time: smallRec.time,
        [isBillLarge ? 'record' : 'bill']: smallRec,
      });
    }
  }

  // 把剩下的数据加回去
  for (const it of largeRecord) {
    if (idle.shouldIdle()) {
      await idle.sleep();
    }
    if (!matchedLargeRecord.has(it)) {
      matchedLargeRecord.add(it);
      const index = findBreakPoint(result, v => v.time < it.time);
      result.splice(index, 0, {
        id: `${it.id}_~NONE~`,
        score: Number.MAX_SAFE_INTEGER,
        time: it.time,
        [isBillLarge ? 'bill' : 'record']: it,
      });
    }
  }

  return result;
}
