import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { CurrencyApiService } from './currency-api.service';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CurrencyChartComponent } from './currency-chart/currency-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    CurrencyChartComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [CurrencyApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
