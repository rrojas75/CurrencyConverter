export enum DefaultCurrency  {
  PHP = 'PHP',
  USD = 'USD',
  PLN = 'PLN',
}

export enum CurrencyTableOption  {
  A = 'A',
  B = 'B',
  C = 'C',
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
  mid?: number;
  bid?: number;
}

export interface CurrencyHistory {
  code: string;
  currency: string;
  table: string;
  rates: CurrencyHistoryRate[];
}

export interface CurrencyHistoryRate {
  effectiveDate: string;
  mid?: number;
  no: string;
  bid?: number;
}
