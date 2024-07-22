import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { CommonModule } from '@angular/common';
Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit {
  bookings: Booking[] = [];
  runningBookingsCount: number = 0;
  bookingStatusCompletedCount: number = 0;
  pendingPaymentsCount: number = 0;
  pendingPayoutCount: number = 0;
  options: string[] = ['This Month', 'This Year', 'This Week', 'All Time'];
  selectedCustomerOption: string = this.options[0];
  selectedOrderOption: string = this.options[0];
  bookingData: any[] = [];
  labeldata: any[] = [];
  realdata: any[] = [];
  colordata: any[] = [];

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.bookingService.getAllBookings().subscribe((response) => {
      this.bookings = response;
      this.countBookings();
    });
  }

  onCustomerOptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCustomerOption = selectElement.value;
  }

  onOrderOptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedOrderOption = selectElement.value;
  }
  countBookings(): void {
    this.runningBookingsCount = this.bookings.filter(
      (booking) => booking.bookingStatus === 'Running'
    ).length;

    this.bookingStatusCompletedCount = this.bookings.filter(
      (booking) => booking.bookingStatus === 'Completed'
    ).length;

    // Combine counts for 'Pending' and 'HalfPaid'
    this.pendingPaymentsCount = this.bookings.filter(
      (booking) =>
        booking.paymentStatus === 'Pending' ||
        booking.paymentStatus === 'HalfPaid'
    ).length;

    // Count bookings where payout is not equal to 0
    this.pendingPayoutCount = this.bookings.filter(
      (booking) => booking.payout !== 0
    ).length;

    // Set bookingData after calculating counts
    this.bookingData = [
      {
        label: 'Active',
        amount: this.runningBookingsCount,
        colorcode: 'green',
      },
      {
        label: 'Pending',
        amount: this.pendingPaymentsCount,
        colorcode: 'yellow',
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

  loadChartData() {
    if (this.bookingData != null) {
      this.bookingData.map((b) => {
        this.labeldata.push(b.label);
        this.realdata.push(b.amount);
        this.colordata.push(b.colorcode);
      });
      this.RenderbarChart(this.labeldata, this.realdata, this.colordata);
    }
  }

  RenderbarChart(labeldata: any, valuedata: any, colordata: any) {
    this.RenderChart(
      labeldata,
      valuedata,
      colordata,
      'doughnutchart',
      'doughnut'
    );
  }

  RenderChart(
    labeldata: any,
    valuedata: any,
    colordata: any,
    chartid: string,
    charttype: any
  ) {
    const mychar = new Chart(chartid, {
      type: charttype,
      data: {
        labels: labeldata,
        datasets: [
          {
            label: 'Orders',
            data: valuedata,
            backgroundColor: colordata,
          },
        ],
      },
      options: {
        tooltips: {
          callbacks: {
            label: function(tooltipItem: any, data: any) {
              const label = data.labels[tooltipItem.index];
              const value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
              return `${label}: ${value}`;
            }
          }
        }
      }
    });
  }
}
