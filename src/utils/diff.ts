import { BillTypeName } from '@/constant';
import { BillType, type IBillItem, type IRecordItem } from '@/types';
import { findBreakPoint } from './arr';
import { Idle } from './idle';

export interface IBillDiffResult {
  id: string;
  score: number;
  time: number;
  bill?: IRecordItem;
  record?: IRecordItem;
}

const MONEY_WEIGHT = 10;
const TIME_WEIGHT = 1;
const MAX_SCORE = 5000;

/**
 * diff 前的数据预处理
 * 做了两件事：
 * 1. 根据accountName，筛选出相关的记录
 * 2. 将记录转为IRecordItem的格式
 */
export async function prepareBillRecord(
  accountNames: string[],
  bill: IBillItem[],
) {
  const result: IRecordItem[] = [];
  const idle = new Idle();

  for (let i = 0; i < bill.length; i++) {
    if (idle.shouldIdle()) {
      await idle.sleep();
    }
    const item = bill[i];
    let accountName = '';
    if (accountNames.includes(item.account1)) {
      accountName = item.account1;
    }
    if (accountNames.includes(item.account2)) {
      accountName = item.account2;
    }
    if (!accountName) {
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
/**
 * 对两个数据进行 diff，产生新的数据
 * 假设分别为A、B两个数组，其中A数组数量更多
 * 对B数组中的每一项，称为item:
 * 1. 确定item对应A数组的范围（与item首尾差在2天以内的数据）
 * 2. 分别计算A数组在该范围内所有项目与item的差异分值
 *  2.1 如果金额完全相同，时间差在2min以内，视为完全相同
 *  2.2 否则，视为非完全相同
 * 3. 按差异分值从低到高排序，其中完全相同的项目排在最前
 * 4. 将匹配度最高的，且差异分值小于MAX_SCORE的，当做与item相同的条目（称为target）
 * 5. 【TODO】回溯之前已经进行过的匹配
 *  5.1 如target未使用过，不处理
 *  5.2 如target已使用：
 *   5.2.1 target对应的条目匹配度更高（差异分值更小），则item尝试使用次一条匹配的，否则回溯修改target现在对应的条目
 */
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
