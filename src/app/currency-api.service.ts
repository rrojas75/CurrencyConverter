import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CurrencyHistory,
  CurrencyTable,
  CurrencyTableRate,
} from './currency.model';
import { map } from 'rxjs/operators';

@Injectable()
export class CurrencyApiService {
  constructor(private http: HttpClient) {}

  getCurrencies(tableCode: string): Observable<CurrencyTableRate[]> {
    return this.getCurrencyTable(tableCode).pipe(
      map((response) =>
        response[0].rates?.map((rate: CurrencyTableRate) => ({
          code: rate.code,
          currency: rate.currency,
          mid: rate.mid,
        }))
      )
    );
  }

  getPastCurrencyRate(
    tableCode: string,
    code: string,
    startDate: string,
    endDate: string
  ): Observable<CurrencyHistory> {
    return this.http.get<CurrencyHistory>(
      `http://api.nbp.pl/api/exchangerates/rates/${tableCode}/${code}/${startDate}/${endDate}/`
    );
  }

  private getCurrencyTable(tableCode: string): Observable<CurrencyTable[]> {
    return this.http.get<CurrencyTable[]>(
      `http://api.nbp.pl/api/exchangerates/tables/${tableCode}/`
    );
  }
}
