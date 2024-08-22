import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-multiple-unit-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multiple-unit-dashboard.component.html',
  styleUrl: './multiple-unit-dashboard.component.css',
})
export class MultipleUnitDashboardComponent implements OnInit {
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  chart: Chart<'doughnut', number[], string> | undefined;

  items = [
    {
      imgSrc: 'assets/images/vehicle-available.svg',
      count: 10,
      text: 'Vehicle Available',
      color: '#9bb4fc',
    },
    {
      imgSrc: 'assets/images/driver-available.svg',
      count: 20,
      text: 'Driver Available',
      color: 'rgb(216 184 247)',
    },
    {
      imgSrc: 'assets/images/completed.svg',
      count: 15,
      text: 'Completed',
      color: 'rgb(200 191 255)',
    },
    {
      imgSrc: 'assets/images/ongoing.svg',
      count: 5,
      text: 'Ongoing',
      color: 'rgb(145 230 241)',
    },
    {
      imgSrc: 'assets/images/awaiting.svg',
      count: 8,
      text: 'Awaiting',
      color: 'rgb(178 253 209)',
    },
  ];

  ngOnInit(): void {
    this.loadChartData();
  }

  loadChartData() {
    if (this.items != null) {
      this.labeldata = this.items.map(b => b.text);
      this.realdata = this.items.map(b => b.count);
      this.colordata = this.items.map(b => b.color);
      this.renderChart(this.labeldata, this.realdata, this.colordata);
    }
  }

  renderChart(labeldata: string[], valuedata: number[], colordata: string[]) {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart('doughnutchart', {
      type: 'doughnut',
      data: {
        // labels: labeldata,
        datasets: [
          {
            data: valuedata,
            backgroundColor: colordata,
          },
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (tooltipItem: any) {
                const label = tooltipItem.label;
                const value = tooltipItem.raw;
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });

    this.renderAnnotations(labeldata, valuedata, colordata);
  }

  renderAnnotations(labels: string[], values: number[], colors: string[]) {
    const annotationsElement = document.getElementById('chart-annotations');
    if (!annotationsElement) {
      console.error('Annotations element not found');
      return;
    }

    // Clear previous annotations
    annotationsElement.innerHTML = '';

    labels.forEach((label: string, index: number) => {
      const value = values[index];
      const color = colors[index];

      const annotationDiv = document.createElement('div');
      annotationDiv.classList.add('annotation');
      annotationDiv.innerHTML = `
        <div class="circle-forData" style="background-color:${color};"></div>
        <div class="annotation-label">${label}</div>
        <div class="annotation-value">${value}</div>
      `;
      annotationsElement.appendChild(annotationDiv);
    });
  }

}
