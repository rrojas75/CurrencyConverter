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

  getCurrencies(): Observable<CurrencyTableRate[]> {
    return this.getCurrencyTable().pipe(
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
    code: string,
    startDate: string,
    endDate: string
  ): Observable<CurrencyHistory> {
    return this.http.get<CurrencyHistory>(
      `http://api.nbp.pl/api/exchangerates/rates/a/${code}/${startDate}/${endDate}/`
    );
  }

  private getCurrencyTable(): Observable<CurrencyTable[]> {
    return this.http.get<CurrencyTable[]>(
      'http://api.nbp.pl/api/exchangerates/tables/a/'
    );
  }
}
