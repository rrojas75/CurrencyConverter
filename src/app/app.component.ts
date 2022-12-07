import { Component, OnInit, OnDestroy } from '@angular/core';
import { CurrencyApiService } from './currency-api.service';
import { takeUntil, first } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import {
  CurrencyHistoryRate,
  CurrencyTableRate,
  DefaultCurrency,
} from './currency.model';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DatePipe],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Currency Converter';
  dateLabel: string[] = [];
  exchangeRates: number[] = [];
  refreshingChart: boolean = false;
  currencies: CurrencyTableRate[] = [];
  formGroup = this.fb.group({
    fromCurrencyCode: [DefaultCurrency.USD],
    toCurrencyCode: [DefaultCurrency.PHP],
    fromAmount: [0],
    toAmount: [0],
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private currencyApiService: CurrencyApiService,
    private datepipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.currencyApiService.getCurrencies().pipe(
      first()
    ).subscribe(currencies => {
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

  private setupFormValueChanges(): void {
    const fromAmountControl = this.formGroup.controls['fromAmount'];
    const toAmountControl = this.formGroup.controls['toAmount'];
    const fromCurrencyCodeControl = this.formGroup.controls['fromCurrencyCode'];
    const toCurrencyCodeControl = this.formGroup.controls['toCurrencyCode'];

    fromAmountControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromAmount) => {
        toAmountControl.setValue(
          this.getExchangeRateAmount({
            fromAmount: fromAmount ?? 0,
          })
        );
      });

    fromCurrencyCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromCode) => {
        const fromCodeParams = fromCode ?? '';
        toAmountControl.setValue(
          this.getExchangeRateAmount({ fromCode: fromCodeParams })
        );
        this.loadChartData({ fromCode: fromCodeParams });
      });

    toCurrencyCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((toCode) => {
        const toCodeParams = toCode ?? '';
        toAmountControl.setValue(
          this.getExchangeRateAmount({ toCode: toCodeParams })
        );
        this.loadChartData({ toCode:toCodeParams });
      });
  }

  private getExchangeRateAmount(params: {
    fromCode?: string;
    toCode?: string;
    fromAmount?: number;
  }): number {
    const formValue = this.formGroup.value;
    const fromCode = params?.fromCode ?? formValue.fromCurrencyCode;
    const toCode = params?.toCode ?? formValue.toCurrencyCode;
    const fromAmount = params?.fromAmount ?? formValue.fromAmount ?? 0;

    const fromRate =
      this.currencies.find((c) => c.code === fromCode)?.mid ?? 0;
    const toRate = this.currencies.find((c) => c.code === toCode)?.mid ?? 0;
    const exchangeRate = fromRate / toRate;

    return Math.round((exchangeRate * fromAmount + Number.EPSILON) * 100) / 100;
  }

  private loadChartData(params: { fromCode?: string; toCode?: string }): void {
    const lastMonthDate = new Date();
    lastMonthDate.setDate(lastMonthDate.getDate() - 30);
    const startDate = this.datepipe.transform(lastMonthDate,'yyyy-MM-dd') ?? '';
    const endDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd') ?? '';
    const formValue = this.formGroup.value;
    const fromCode = params?.fromCode ?? formValue.fromCurrencyCode;
    const toCode = params?.toCode ?? formValue.toCurrencyCode ?? '';

    this.currencyApiService.getPastCurrencyRate(toCode, startDate, endDate).pipe(first()).subscribe((currencyHistory) => {
      const fromRate = this.currencies.find((c) => c.code === fromCode)?.mid ?? 0;
      this.dateLabel = currencyHistory.rates.map(
        (rate: CurrencyHistoryRate) => rate.effectiveDate
      );
      this.exchangeRates = currencyHistory.rates.map(
        (rate: CurrencyHistoryRate) => fromRate / rate.mid
      );
      this.currencies = this.currencies;

      this.refreshingChart = true;
      setTimeout(() => {
        this.refreshingChart = false;
      });
    });
  }
}
