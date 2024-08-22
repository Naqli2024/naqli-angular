import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { CommonModule } from '@angular/common';
Chart.register(...registerables);
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, isWithinInterval } from 'date-fns';
import { CustomerChartComponent } from './customer-chart/customer-chart.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, CustomerChartComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})

export class OverviewComponent implements OnInit {
  bookings: Booking[] = [];
  runningBookingsCount: number = 0;
  bookingStatusCompletedCount: number = 0;
  pendingPaymentsCount: number = 0;
  pendingPayoutCount: number = 0;
  options: string[] = ['All Time', 'This Week', 'This Month', 'This Year'];
  selectedCustomerOption: string = this.options[0];
  bookingData: any[] = [];
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  chart: Chart<'doughnut', number[], string> | undefined;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.bookingService.getAllBookings().subscribe((response) => {
      this.bookings = response;
      this.filterBookingsAndCount();
    });
  }

  onOrderOptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCustomerOption = selectElement.value;
    this.filterBookingsAndCount();
  }

  filterBookingsAndCount(): void {
    const filteredBookings = this.filterBookingsByTimePeriod(this.selectedCustomerOption);

    this.runningBookingsCount = filteredBookings.filter(
      (booking) => booking.bookingStatus === 'Running'
    ).length;

    this.bookingStatusCompletedCount = filteredBookings.filter(
      (booking) => booking.bookingStatus === 'Completed'
    ).length;

    this.pendingPaymentsCount = filteredBookings.filter(
      (booking) =>
        booking.paymentStatus === 'Pending' ||
        booking.paymentStatus === 'HalfPaid'
    ).length;

    this.pendingPayoutCount = filteredBookings.filter(
      (booking) => booking.payout !== 0
    ).length;

    this.bookingData = [
      {
        label: 'All orders',
        amount: filteredBookings.length,
        colorcode: 'black'
      },
      {
        label: 'Active',
        amount: this.runningBookingsCount,
        colorcode: 'green',
      },
      {
        label: 'Pending',
        amount: this.pendingPaymentsCount,
        colorcode: 'orange',
      },
      {
        label: 'Finished',
        amount: this.bookingStatusCompletedCount,
        colorcode: '#7F6AFF',
      },
      { label: 'Cancelled', amount: 0, colorcode: 'red' },
    ];
    this.loadChartData();
  }

  filterBookingsByTimePeriod(option: string): Booking[] {
    const now = new Date();
    switch (option) {
      case 'This Week':
        return this.bookings.filter(booking =>
          isWithinInterval(new Date(booking.createdAt), {
            start: startOfWeek(now),
            end: endOfWeek(now),
          })
        );
      case 'This Month':
        return this.bookings.filter(booking =>
          isWithinInterval(new Date(booking.createdAt), {
            start: startOfMonth(now),
            end: endOfMonth(now),
          })
        );
      case 'This Year':
        return this.bookings.filter(booking =>
          isWithinInterval(new Date(booking.createdAt), {
            start: startOfYear(now),
            end: endOfYear(now),
          })
        );
      case 'All Time':
      default:
        return this.bookings;
    }
  }

  loadChartData() {
    if (this.bookingData != null) {
      this.labeldata = this.bookingData.map(b => b.label);
      this.realdata = this.bookingData.map(b => b.amount);
      this.colordata = this.bookingData.map(b => b.colorcode);
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
