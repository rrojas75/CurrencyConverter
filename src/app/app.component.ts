import { Component, OnInit, OnDestroy } from '@angular/core';
import { CurrencyApiService } from './currency-api.service';
import { takeUntil, first, map, tap, filter } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import {
  CurrencyHistoryRate,
  CurrencyTableOption,
  CurrencyTableRate,
  DefaultCurrency,
} from './currency.model';
import { Subject, zip } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DatePipe],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly defaultCurrencies = DefaultCurrency;

  title = 'Currency Converter';
  dateLabel: string[] = [];
  exchangeRates: number[] = [];
  refreshingChart: boolean = false;
  currencies: CurrencyTableRate[] = [];
  isEditingToAmount: boolean = false;
  isEditingFromAmount: boolean = false;
  isDropdownSelect: boolean = false;
  formGroup = this.fb.group({
    fromCurrencyCode: [DefaultCurrency.USD],
    toCurrencyCode: [DefaultCurrency.PHP],
    fromAmount: [0],
    toAmount: [0],
  });

  private currenciesBTable: CurrencyTableRate[] = [];
  private currenciesCTable: CurrencyTableRate[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private currencyApiService: CurrencyApiService,
    private datepipe: DatePipe
  ) {}

  ngOnInit(): void {
    zip(
      this.currencyApiService.getCurrencies(CurrencyTableOption.A),
      this.currencyApiService.getCurrencies(CurrencyTableOption.B),
      this.currencyApiService.getCurrencies(CurrencyTableOption.C).pipe(
        map((currencies) =>
          currencies.map((c) => ({
            code: c.code,
            currency: c.currency,
            mid: c?.bid,
          }))
        )
      )
    )
      .pipe(
        tap(([_, b, c]) => {
          this.currenciesBTable = b;
          this.currenciesCTable = c;
        }),
        map(([a, b, c]) => [...new Set([...a, ...b, ...c])]),
        first()
      )
      .subscribe((currencies) => {
        this.currencies = currencies;
        this.loadChartData({
          fromCode: DefaultCurrency.USD,
          toCode: DefaultCurrency.PHP,
        });
      });

    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFocusFromAmountField() {
    this.isEditingFromAmount = true;
    this.isEditingToAmount = false;
    this.isDropdownSelect = false;
  }

  onFocusToAmountField() {
    this.isEditingToAmount = true;
    this.isEditingFromAmount = false;
    this.isDropdownSelect = false;
  }

  private setupFormValueChanges(): void {
    const fromAmountControl = this.formGroup.controls['fromAmount'];
    const toAmountControl = this.formGroup.controls['toAmount'];
    const fromCurrencyCodeControl = this.formGroup.controls['fromCurrencyCode'];
    const toCurrencyCodeControl = this.formGroup.controls['toCurrencyCode'];

    fromAmountControl.valueChanges
      .pipe(
        filter(() => !this.isEditingToAmount && !this.isDropdownSelect),
        takeUntil(this.destroy$)
      )
      .subscribe((fromAmount) => {
        toAmountControl.setValue(
          this.getExchangeRateAmount({
            fromAmount: fromAmount ?? 0,
          })
        );
      });

    toAmountControl.valueChanges
      .pipe(
        filter(() => !this.isEditingFromAmount && !this.isDropdownSelect),
        takeUntil(this.destroy$)
      )
      .subscribe((toAmount) => {
        fromAmountControl.setValue(
          this.getExchangeRateAmount({
            toAmount: toAmount ?? 0,
          })
        );
      });

    fromCurrencyCodeControl.valueChanges
      .pipe(
        tap(() => (this.isDropdownSelect = true)),
        filter(() => !this.isEditingToAmount),
        takeUntil(this.destroy$)
      )
      .subscribe((fromCode) => {
        const fromCodeParams = fromCode ?? '';
        toAmountControl.setValue(
          this.getExchangeRateAmount({ fromCode: fromCodeParams })
        );
        this.loadChartData({ fromCode: fromCodeParams });
      });

    toCurrencyCodeControl.valueChanges
      .pipe(
        tap(() => (this.isDropdownSelect = true)),
        takeUntil(this.destroy$)
      )
      .subscribe((toCode) => {
        const toCodeParams = toCode ?? '';
        toAmountControl.setValue(
          this.getExchangeRateAmount({ toCode: toCodeParams })
        );
        this.loadChartData({ toCode: toCodeParams });
      });
  }

  private getExchangeRateAmount(params: {
    fromCode?: string;
    toCode?: string;
    fromAmount?: number;
    toAmount?: number;
  }): number {
    const formValue = this.formGroup.value;
    const fromCode = params?.fromCode ?? formValue.fromCurrencyCode;
    const toCode = params?.toCode ?? formValue.toCurrencyCode;
    const fromAmount = params?.fromAmount ?? formValue.fromAmount ?? 0;
    const toAmount = params?.toAmount ?? formValue.toAmount ?? 0;
    const fromRate = this.currencies.find((c) => c.code === fromCode)?.mid ?? 0;
    const toRate = this.currencies.find((c) => c.code === toCode)?.mid ?? 0;
    const exchangeAmount = params?.toAmount ? toAmount : fromAmount;

    let exchangeRate = params?.toAmount ? toRate / fromRate : fromRate / toRate;
    if (fromCode === DefaultCurrency.PLN) {
      exchangeRate = 1 / toRate;
    } else if (toCode === DefaultCurrency.PLN) {
      exchangeRate = fromRate;
    }

    let exchangeAmountValue = exchangeRate * exchangeAmount;
    if (toCode === DefaultCurrency.PLN && params?.toAmount) {
      exchangeAmountValue = params.toAmount / fromRate;
    } else if (fromCode === DefaultCurrency.PLN && params?.toAmount) {
      exchangeAmountValue = params.toAmount / (1 / toRate);
    }
    return Math.round((exchangeAmountValue + Number.EPSILON) * 100) / 100;
  }

  private loadChartData(params: { fromCode?: string; toCode?: string }): void {
    const lastMonthDate = new Date();
    lastMonthDate.setDate(lastMonthDate.getDate() - 30);
    const startDate =
      this.datepipe.transform(lastMonthDate, 'yyyy-MM-dd') ?? '';
    const endDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd') ?? '';
    const formValue = this.formGroup.value;
    const fromCode = params?.fromCode ?? formValue.fromCurrencyCode;
    const toCode = params?.toCode ?? formValue.toCurrencyCode ?? '';
    const toTableCode = this.getTableCode(toCode);
    const fromRate = this.currencies.find((c) => c.code === fromCode)?.mid ?? 0;

    let toCodeParams = toCode;
    if (toCode === DefaultCurrency.PLN) {
      toCodeParams = fromCode ?? '';
    }
    this.currencyApiService
      .getPastCurrencyRate(toTableCode, toCodeParams, startDate, endDate)
      .pipe(first())
      .subscribe((currencyHistory) => {
        this.dateLabel = currencyHistory.rates.map(
          (rate: CurrencyHistoryRate) => rate.effectiveDate
        );
        this.exchangeRates = currencyHistory.rates.map(
          (rate: CurrencyHistoryRate) => {
            const responseRate = rate?.mid ?? rate?.bid ?? 0;

            let exchangeRate = fromRate / responseRate;
            if (fromCode === DefaultCurrency.PLN) {
              exchangeRate = 1 / responseRate;
            } else if (toCode === DefaultCurrency.PLN) {
              exchangeRate = responseRate;
            }

            return exchangeRate;
          }
        );
        this.currencies = this.currencies;

        this.refreshingChart = true;
        setTimeout(() => {
          this.refreshingChart = false;
        });
      });
  }

  private getTableCode(toCode: string): string {
    if (this.currenciesBTable.map((c) => c.code).includes(toCode)) {
      return CurrencyTableOption.B;
    } else if (this.currenciesCTable.map((c) => c.code).includes(toCode)) {
      return CurrencyTableOption.C;
    }
    return CurrencyTableOption.A;
  }
}
