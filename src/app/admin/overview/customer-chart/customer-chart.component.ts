import { Component } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Booking } from '../../../../models/booking.model';
Chart.register(...registerables);
import {
  format,
  startOfDay, 
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { BookingService } from '../../../../services/booking.service';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-customer-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './customer-chart.component.html',
  styleUrl: './customer-chart.component.css',
})
export class CustomerChartComponent {
  bookings: Booking[] = [];
  users: User[] = [];
  options: string[] = ['AllTime', 'ThisWeek', 'ThisMonth', 'ThisYear', 'Today'];
  selectedCustomerOption: string = this.options[0];
  bookingData: any[] = [];
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  chart: Chart<'doughnut', number[], string> | undefined;

  constructor(private bookingService: BookingService, private userService: UserService) {}

  ngOnInit(): void {
    this.bookingService.getAllBookings().subscribe((response) => {
      this.bookings = response;
      this.filterBookingsAndCount();
    });
    this.userService.getAllUsers().subscribe((response) => {
      this.users = response;
    })
  }

  onCustomerOptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCustomerOption = selectElement.value;
    this.filterBookingsAndCount();
  }

  filterBookingsAndCount(): void {
    const filteredBookings = this.filterBookingsByDate(this.bookings, this.selectedCustomerOption);

    const userBookingCount = this.users.reduce((acc, user) => {
      acc[user._id] = 0;
      return acc;
    }, {} as Record<string, number>);

    filteredBookings.forEach(booking => {
      if (userBookingCount[booking.user]) {
        userBookingCount[booking.user]++;
      } else {
        userBookingCount[booking.user] = 1;
      }
    });

    const newUsers = this.users.filter(user => userBookingCount[user._id] === 0).length;
    const constantUsers = this.users.filter(user => userBookingCount[user._id] > 1).length;
    const otherUsers = this.users.filter(user => userBookingCount[user._id] === 1).length;

    this.bookingData = [
      {
        label: 'All customers',
        amount: this.users.length,
        colorcode: 'black'
      },
      {
        label: 'New',
        amount: newUsers,
        colorcode: 'green',
      },
      {
        label: 'Constant',
        amount: constantUsers,
        colorcode: 'orange',
      },
      {
        label: 'Other',
        amount: otherUsers,
        colorcode: '#7F6AFF',
      },
    ];

    this.loadChartData();
  }

  filterBookingsByDate(bookings: Booking[], option: string): Booking[] {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (option) {
      case 'Today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'ThisWeek':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'ThisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'ThisYear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'AllTime':
      default:
        return bookings;
    }

    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.createdAt);
      return isWithinInterval(bookingDate, { start: startDate, end: endDate });
    });
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
    this.chart = new Chart('customerChart', {
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
    const annotationsElement = document.getElementById('customer-chart-annotations');
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
      annotationDiv.classList.add('customer-chart-annotation');
      annotationDiv.innerHTML = `
        <div class="circle-forData" style="background-color:${color};"></div>
        <div class="annotation-label">${label}</div>
        <div class="annotation-value">${value}</div>
      `;
      annotationsElement.appendChild(annotationDiv);
    });
  }
}
