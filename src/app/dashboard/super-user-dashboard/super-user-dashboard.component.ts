import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../services/partner/partner.service';
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

@Component({
  selector: 'app-super-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './super-user-dashboard.component.html',
  styleUrl: './super-user-dashboard.component.css',
})
export class SuperUserDashboardComponent {
  bookings: any[] = [];
  vendorsByBooking: any = {};
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  options: string[] = ['All Time', 'This Week', 'Monthly', 'This Year'];
  bookingData: any[] = [];
  selectedCustomerOption: string = this.options[0];
  pendingPaymentStatus: number = 0;
  completedPaymentStatus: number = 0;
  halfPaidPaymentStatus: number = 0;
  paidPaymentStatus: number = 0;
  chart: Chart<'line', number[], string> | undefined;

  myBookings = [
    {
      status: 'Pending',
      numberOfBookings: 0,
      colorCode: '#F82D44',
    },
    {
      status: 'HalfPaid',
      numberOfBookings: 0,
      colorCode: '#F7E6B0',
    },
    {
      status: 'Completed',
      numberOfBookings: 0,
      colorCode: '#57C012',
    },
    {
      status: 'Paid',
      numberOfBookings: 0,
      colorCode: '#7F6AFF',
    },
  ];

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    this.getBookingDetails();
  }

  loadchartdata() {
    this.myBookings.map((o) => {
      this.labeldata.push(o.status);
      this.realdata.push(o.numberOfBookings);
      this.colordata.push(o.colorCode);
    });
    this.Renderchart(this.labeldata, this.realdata, this.colordata);
  }

  Renderchart(labeldata: any, valuedata: any, colordata: any) {
    const mychart = new Chart('doughnutchart', {
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
    });
    // After rendering the chart, add the labels dynamically
    this.addLabelsToChart(labeldata, colordata, valuedata);
  }

  addLabelsToChart(
    labeldata: string[],
    colordata: string[],
    valuedata: number[]
  ) {
    // Get the container where you want to display the labels
    const chartContainer = document.getElementById('chart-labels-container');

    // Clear any previous labels
    if (chartContainer) chartContainer.innerHTML = '';

    // Loop through the label data to create a flexbox layout for labels
    labeldata.forEach((label, index) => {
      const labelElement = document.createElement('div');
      labelElement.classList.add('label-item');

      const colorBox = document.createElement('div');
      colorBox.style.backgroundColor = colordata[index];
      colorBox.classList.add('color-box');

      const text = document.createElement('span');
      text.textContent = `${label}: ${valuedata[index]}`;

      // Append colorBox and text to the label element
      labelElement.appendChild(colorBox);
      labelElement.appendChild(text);

      // Append the label element to the container
      chartContainer?.appendChild(labelElement);
    });
  }

  getBookingDetails(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe((response) => {
        this.bookings = response.data;
        this.calculateBookingCounts();
        this.loadchartdata();
        this.bookings.forEach((booking) => {
          this.getTopVendors(booking);
        });
      });
    }
  }

  calculateBookingCounts(): void {
    // Reset the numberOfBookings to 0 before recalculating
    this.myBookings.forEach((booking) => (booking.numberOfBookings = 0));

    // Loop through the bookings and increment the count for each paymentStatus
    this.bookings.forEach((booking) => {
      let statusBooking;

      if (booking.paymentStatus === 'Pending') {
        statusBooking = this.myBookings.find((b) => b.status === 'Pending');
      } else if (booking.paymentStatus === 'HalfPaid') {
        statusBooking = this.myBookings.find((b) => b.status === 'HalfPaid');
      } else if (booking.paymentStatus === 'Completed') {
        statusBooking = this.myBookings.find((b) => b.status === 'Completed');
      } else if (booking.paymentStatus === 'Paid') {
        statusBooking = this.myBookings.find((b) => b.status === 'Paid');
      }

      // Only increment if statusBooking is found
      if (statusBooking) {
        statusBooking.numberOfBookings++;
      }
    });
  }

  // Fetch top vendors based on booking details
  getTopVendors(booking): void {
    const requestBody = {
      bookingId: booking._id,
      unitType: booking.unitType,
      unitClassification: booking.name,
      subClassification: booking.type.typeName,
    };

    this.partnerService.getTopPartners(requestBody).subscribe(
      (response: any) => {
        if (response.success) {
          this.vendorsByBooking[booking._id] = response.data.map(
            (vendor: any) => ({
              name: vendor.partnerName,
              price: vendor.quotePrice || 'N/A',
              partnerId: vendor.partnerId,
              oldQuotePrice: vendor.oldQuotePrice,
            })
          );
        }
      },
      (error) => {
        const errorMessage = error.error?.message || 'An error occurred';
      }
    );
  }

  createBooking(): void {
    this.router.navigate(['/home/user']);
  }

  navigateToTriggerBooking(): void {
    this.router.navigate(['/home/user/dashboard/super-user/trigger-booking']);
  }

  onOrderOptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCustomerOption = selectElement.value;
    this.filterBookingsAndCount();
  }

  filterBookingsAndCount(): void {
    const filteredBookings = this.filterBookingsByTimePeriod(
      this.selectedCustomerOption
    );

    // Handle non-monthly options where bookings are individual objects with paymentStatus
    if (this.selectedCustomerOption !== 'Monthly') {
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
        {
          label: 'All Bookings',
          amount: filteredBookings.length,
          colorcode: 'black',
        },
        {
          label: 'Pending',
          amount: this.pendingPaymentStatus,
          colorcode: 'green',
        },
        {
          label: 'Completed',
          amount: this.completedPaymentStatus,
          colorcode: 'orange',
        },
        {
          label: 'HalfPaid',
          amount: this.halfPaidPaymentStatus,
          colorcode: '#7F6AFF',
        },
        { label: 'Paid', amount: this.paidPaymentStatus, colorcode: 'red' },
      ];
    } else {
      // For monthly, bookingData is not relevant; we will handle it separately
      this.bookingData = []; // Clear bookingData
    }

    this.loadLineChartData();
  }

  filterBookingsByTimePeriod(option: string): any[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeekDay = now.getDay();

    if (option === 'Monthly') {
      // Monthly aggregated data
      const monthlyBookings = Array(12)
        .fill(0)
        .map((_, index) => ({
          month: new Date(currentYear, index).toLocaleString('default', {
            month: 'short',
          }),
          count: 0,
        }));

      this.bookings.forEach((booking) => {
        const bookingDate = new Date(booking.createdAt);
        if (bookingDate.getFullYear() === currentYear) {
          const monthIndex = bookingDate.getMonth(); // 0 for Jan, 1 for Feb, etc.
          monthlyBookings[monthIndex].count++;
        }
      });

      return monthlyBookings;
    }

    if (option === 'This Week') {
      // Initialize an array for the week
      const weeklyBookings = Array(7)
        .fill(0)
        .map((_, index) => ({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
          count: 0,
        }));

      this.bookings.forEach((booking) => {
        const bookingDate = new Date(booking.createdAt);

        // Check if the booking is in the current week
        if (
          isWithinInterval(bookingDate, {
            start: startOfWeek(now),
            end: endOfWeek(now),
          })
        ) {
          const bookingDayIndex = bookingDate.getDay();
          weeklyBookings[bookingDayIndex].count++;
        }
      });

      return weeklyBookings;
    }

    // Filter for 'This Year', 'All Time'
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

  loadLineChartData() {
    if (this.bookingData != null) {
      // Handle monthly data
      if (this.selectedCustomerOption === 'Monthly') {
        const filteredBookings = this.filterBookingsByTimePeriod(
          this.selectedCustomerOption
        );

        this.labeldata = filteredBookings.map((b) => b.month); // Monthly labels
        this.realdata = filteredBookings.map((b) => b.count); // Booking count per month
        this.colordata = Array(12).fill('#7F6AFF'); // Set same color or customize as needed

        this.renderLineChart(this.labeldata, this.realdata, this.colordata);

        // Handle weekly data
      } else if (this.selectedCustomerOption === 'This Week') {
        const filteredBookings = this.filterBookingsByTimePeriod(
          this.selectedCustomerOption
        );

        this.labeldata = filteredBookings.map((b) => b.day); // Day labels (Sun, Mon, Tue, ...)
        this.realdata = filteredBookings.map((b) => b.count); // Booking count per day
        this.colordata = Array(7).fill('#7F6AFF'); // Set same color or customize as needed

        this.renderLineChart(this.labeldata, this.realdata, this.colordata);

        // Handle other options
      } else {
        this.labeldata = this.bookingData.map((b) => b.label);
        this.realdata = this.bookingData.map((b) => b.amount);
        this.colordata = this.bookingData.map((b) => b.colorcode);

        this.renderLineChart(this.labeldata, this.realdata, this.colordata);
      }
    }
  }

  renderLineChart(
    labeldata: string[],
    valuedata: number[],
    colordata: string[]
  ) {
    if (this.chart) {
      this.chart.destroy(); // Destroy old chart to avoid overlap
    }

    // Determine the x-axis title based on the selected option
    let xAxisTitle = '';
    switch (this.selectedCustomerOption) {
      case 'Monthly':
        xAxisTitle = 'Monthly';
        break;
      case 'This Week':
        xAxisTitle = 'Weekly';
        break;
      case 'This Year':
        xAxisTitle = 'Yearly';
        break;
      case 'All Time':
        xAxisTitle = 'All Time';
        break;
      default:
        xAxisTitle = 'All Time';
    }

    this.chart = new Chart('linechart', {
      type: 'line',
      data: {
        labels: labeldata,
        datasets: [
          {
            label: 'Bookings',
            data: valuedata,
            backgroundColor: colordata,
            borderColor: '#4b9cd3', // Line color
            fill: false, // No fill under the line
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: xAxisTitle },
            grid: { display: false },
          }, // X-axis title
          y: {
            title: { display: true, text: 'Number of Bookings' },
            ticks: { display: false },
            grid: { display: false },
          }, // Y-axis title
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
