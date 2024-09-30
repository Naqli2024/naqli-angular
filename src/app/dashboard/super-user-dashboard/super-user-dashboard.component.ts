import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../services/partner/partner.service';
import { DashboardLineChartComponent } from './dashboard-line-chart/dashboard-line-chart.component';
Chart.register(...registerables);

@Component({
  selector: 'app-super-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLineChartComponent],
  templateUrl: './super-user-dashboard.component.html',
  styleUrl: './super-user-dashboard.component.css',
})
export class SuperUserDashboardComponent {
  bookings: any[] = [];
  vendorsByBooking: any = {};
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  bookingData: any[] = [];
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
}
