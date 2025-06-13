export enum BillType {
  INCOME = 0, // 收入
  EXPENSE = 1, // 支出
  TRANSFER = 2, // 转账
  BORROW_IN = 3, // 债务-借入
  BORROW_OUT = 4, // 债务-借出
  PAYBACK_IN = 5, // 债务-收款
  PAYBACK_OUT = 6, // 债务-还款
}

export interface IBillItem {
  id: string;
  type: BillType;
  money: string;
  account1: string;
  account2: string;
  time: number;
  category: string;
  remark: string;
}

export interface IRecordItem {
  id: string;
  account: string;
  type: BillType;
  time: number;
  money: string;
  remark: string;
}

export interface IBillAppConfig {
  key: string;
  name: string;
  picker: () => Promise<File>;
  parser: (file: File) => Promise<IBillItem[]>;
}

export interface IRecordAppConfig {
  key: string;
  name: string;
  picker: () => Promise<File>;
  parser: (file: File, account: string) => Promise<IRecordItem[]>;
}
