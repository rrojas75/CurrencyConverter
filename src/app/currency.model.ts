export enum DefaultCurrency  {
  PHP = 'PHP',
  USD = 'USD',
}

export interface CurrencyTable {
  effectiveDate: string;
  no: string;
  table: string;
  rates: CurrencyTableRate[];
}

export interface CurrencyTableRate {
  code: string;
  currency: string;
  mid: number;
}

export interface CurrencyHistory {
  code: string;
  currency: string;
  table: string;
  rates: CurrencyHistoryRate[];
}

export interface CurrencyHistoryRate {
  effectiveDate: string;
  mid: number;
  no: string;
}
