import { Component, OnInit } from '@angular/core';
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isWithinInterval,
} from 'date-fns';
Chart.register(...registerables);
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../../services/booking.service';

@Component({
  selector: 'app-dashboard-line-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-line-chart.component.html',
  styleUrl: './dashboard-line-chart.component.css'
})
export class DashboardLineChartComponent implements OnInit {
  bookings: any[] = [];
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  bookingData: any[] = [];
  options: string[] = ['All Time', 'This Week', 'Monthly', 'This Year'];
  selectedCustomerOption: string = this.options[0];
  pendingPaymentStatus: number = 0;
  completedPaymentStatus: number = 0;
  halfPaidPaymentStatus: number = 0;
  paidPaymentStatus: number = 0;
  chart: Chart<'line', number[], string> | undefined;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void { 
    this.getBookingDetails();
  }

  getBookingDetails(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe((response) => {
        this.bookings = response.data;
        this.filterBookingsAndCount(); // Ensure chart updates after bookings are loaded
      });
    }
  }

  onOrderOptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCustomerOption = selectElement.value;
    this.filterBookingsAndCount();
  }

  filterBookingsAndCount(): void {
    const filteredBookings = this.filterBookingsByTimePeriod(this.selectedCustomerOption);

    if (this.selectedCustomerOption !== 'Monthly') {
      // Non-monthly data (individual bookings with paymentStatus)
      this.pendingPaymentStatus = filteredBookings.filter(
        (booking: any) => booking.paymentStatus === 'Pending'
      ).length;

      this.completedPaymentStatus = filteredBookings.filter(
        (booking: any) => booking.paymentStatus === 'Completed'
      ).length;

      this.halfPaidPaymentStatus = filteredBookings.filter(
        (booking: any) => booking.paymentStatus === 'HalfPaid'
      ).length;

      this.paidPaymentStatus = filteredBookings.filter(
        (booking: any) => booking.paymentStatus === 'Paid'
      ).length;

      this.bookingData = [
        { label: 'All Bookings', amount: filteredBookings.length, colorcode: 'black' },
        { label: 'Pending', amount: this.pendingPaymentStatus, colorcode: 'green' },
        { label: 'Completed', amount: this.completedPaymentStatus, colorcode: 'orange' },
        { label: 'HalfPaid', amount: this.halfPaidPaymentStatus, colorcode: '#7F6AFF' },
        { label: 'Paid', amount: this.paidPaymentStatus, colorcode: 'red' }
      ];

    } else {
      this.bookingData = []; // Clear data for Monthly view
    }

    this.loadLineChartData();
  }

  filterBookingsByTimePeriod(option: string): any[] {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (option === 'Monthly') {
      const monthlyBookings = Array(12).fill(0).map((_, index) => ({
        month: new Date(currentYear, index).toLocaleString('default', { month: 'short' }),
        count: 0,
      }));

      this.bookings.forEach((booking) => {
        const bookingDate = new Date(booking.createdAt);
        if (bookingDate.getFullYear() === currentYear) {
          const monthIndex = bookingDate.getMonth();
          monthlyBookings[monthIndex].count++;
        }
      });

      return monthlyBookings;

    } else if (option === 'This Week') {
      const weeklyBookings = Array(7).fill(0).map((_, index) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
        count: 0,
      }));

      this.bookings.forEach((booking) => {
        const bookingDate = new Date(booking.createdAt);
        if (isWithinInterval(bookingDate, { start: startOfWeek(now), end: endOfWeek(now) })) {
          const bookingDayIndex = bookingDate.getDay();
          weeklyBookings[bookingDayIndex].count++;
        }
      });

      return weeklyBookings;

    } else {
      switch (option) {
        case 'This Year':
          return this.bookings.filter((booking) => 
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
  }

  loadLineChartData() {
    if (this.bookingData != null) {
      if (this.selectedCustomerOption === 'Monthly') {
        const filteredBookings = this.filterBookingsByTimePeriod(this.selectedCustomerOption);

        this.labeldata = filteredBookings.map((b) => b.month);
        this.realdata = filteredBookings.map((b) => b.count);
        this.colordata = Array(12).fill('#7F6AFF');

        this.renderLineChart(this.labeldata, this.realdata, this.colordata);

      } else if (this.selectedCustomerOption === 'This Week') {
        const filteredBookings = this.filterBookingsByTimePeriod(this.selectedCustomerOption);

        this.labeldata = filteredBookings.map((b) => b.day);
        this.realdata = filteredBookings.map((b) => b.count);
        this.colordata = Array(7).fill('#7F6AFF');

        this.renderLineChart(this.labeldata, this.realdata, this.colordata);

      } else {
        this.labeldata = this.bookingData.map((b) => b.label);
        this.realdata = this.bookingData.map((b) => b.amount);
        this.colordata = this.bookingData.map((b) => b.colorcode);

        this.renderLineChart(this.labeldata, this.realdata, this.colordata);
      }
    }
  }

  renderLineChart(labeldata: string[], valuedata: number[], colordata: string[]) {
    if (this.chart) {
      this.chart.destroy(); // Destroy old chart instance
    }

    let xAxisTitle = '';
    switch (this.selectedCustomerOption) {
      case 'Monthly': xAxisTitle = 'Monthly'; break;
      case 'This Week': xAxisTitle = 'Weekly'; break;
      case 'This Year': xAxisTitle = 'Yearly'; break;
      case 'All Time': xAxisTitle = 'All Time'; break;
      default: xAxisTitle = 'All Time';
    }

    this.chart = new Chart('linechart', {
      type: 'line',
      data: {
        labels: labeldata,
        datasets: [{
          label: 'Bookings',
          data: valuedata,
          backgroundColor: colordata,
          borderColor: '#4b9cd3',
          fill: false,
        }],
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: xAxisTitle },
            grid: { display: false },
          },
          y: {
            title: { display: true, text: 'Number of Bookings' },
            ticks: { display: false },
            grid: { display: false },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (tooltipItem: any) {
                const label = tooltipItem.label;
                const value = tooltipItem.raw;
                return `${label}: ${value} bookings`;
              },
            },
          },
        },
      },
    });
  }
}
