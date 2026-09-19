import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import {
  Chart, ChartConfiguration, ChartData, ChartType,
  BarController, LineController, DoughnutController, PieController,
  BarElement, LineElement, PointElement, ArcElement,
  CategoryScale, LinearScale, Legend, Tooltip, Filler
} from 'chart.js';

Chart.register(
  BarController, LineController, DoughnutController, PieController,
  BarElement, LineElement, PointElement, ArcElement,
  CategoryScale, LinearScale, Legend, Tooltip, Filler
);

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas #canvasRef></canvas>`,
  styles: [':host { display: block; width: 100%; height: 100%; position: relative; }']
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() type: ChartType = 'bar';
  @Input() data!: ChartData;
  @Input() options?: ChartConfiguration['options'];

  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private viewReady = false;

  ngAfterViewInit() {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.viewReady) return;
    if (this.chart) {
      if (changes['data']) {
        this.chart.data = this.data;
      }
      if (changes['options']) {
        this.chart.options = this.options as any;
      }
      this.chart.update();
    } else {
      this.render();
    }
  }

  private render() {
    if (!this.canvasRef || !this.data) return;
    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.type,
      data: this.data,
      options: this.options
    });
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }
}
