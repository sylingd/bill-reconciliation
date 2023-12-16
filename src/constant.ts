import { BillType } from './types';

export const BillTypeName: Record<BillType, string> = {
  [BillType.INCOME]: '收入',
  [BillType.EXPENSE]: '支出',
  [BillType.TRANSFER]: '转账/还款',
  [BillType.BORROW_IN]: '债务-借入',
  [BillType.BORROW_OUT]: '债务-借出',
  [BillType.PAYBACK_IN]: '债务-收款',
  [BillType.PAYBACK_OUT]: '债务-还款',
};
