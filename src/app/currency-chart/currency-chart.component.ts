import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  Input,
} from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-currency-chart',
  templateUrl: './currency-chart.component.html',
  styleUrls: ['./currency-chart.component.scss'],
})
export class CurrencyChartComponent implements AfterViewInit {
  @ViewChild('lineCanvas') lineCanvas: ElementRef | undefined;
  @Input() labels: string[] = [];
  @Input() data: number[] = [];

  lineChart: any;

  constructor() {}

  ngAfterViewInit(): void {
    this.drawLineChart();
  }

  private drawLineChart() {
    this.lineChart = new Chart(this.lineCanvas?.nativeElement, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'Exchange Rate History',
            fill: false,
            backgroundColor: 'rgb(255, 165, 0)',
            borderColor: 'rgb(255, 165, 0)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgb(255, 165, 0)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgb(255, 165, 0)',
            pointHoverBorderColor: 'rgb(255, 165, 0)',
            pointHoverBorderWidth: 1,
            pointRadius: 1,
            pointHitRadius: 10,
            data: this.data,
            spanGaps: false,
          },
        ],
      },
    });
  }
}
