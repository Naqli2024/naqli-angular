import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../services/partner/partner.service';
import { DashboardLineChartComponent } from './dashboard-line-chart/dashboard-line-chart.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ShowBookingDetailsComponent } from './show-booking-details/show-booking-details.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
Chart.register(...registerables);

@Component({
  selector: 'app-super-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLineChartComponent, TranslateModule],
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
  chart: Chart<'line' | 'doughnut', number[], string> | undefined;

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
    // {
    //   status: 'Paid',
    //   numberOfBookings: 0,
    //   colorCode: '#7F6AFF',
    // },
  ];

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private modalService: NgbModal,
    private languageService: LanguageService, 
    private translateService: TranslateService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getBookingDetails();
    this.languageService.currentLanguage$.subscribe((lang) => {
      this.translateStatuses(lang); 
    });
    if (!sessionStorage.getItem('booking')) {
      sessionStorage.setItem('booking', 'true');
      window.location.reload();
    }
  }

  // Method to translate booking statuses
  translateStatuses(lang: string): void {
    this.translateService.get('paymentStatus').subscribe((translatedStatus: any) => {
      // Assuming translatedStatus will give you an object with all payment statuses
      this.myBookings.forEach((booking) => {
        const translatedValue = translatedStatus[booking.status]; // Get the translated status
        if (translatedValue) {
          booking.status = translatedValue; // Update the status with the translated value
        }
      });
      this.loadchartdata();
    });
  }

  loadchartdata() {
    // Clear previous data
    this.labeldata = [];
    this.realdata = [];
    this.colordata = [];

    this.myBookings.map((o) => {
      this.labeldata.push(o.status);
      this.realdata.push(o.numberOfBookings);
      this.colordata.push(o.colorCode);
    });
    this.Renderchart(this.labeldata, this.realdata, this.colordata);
  }

  Renderchart(labeldata: string[], valuedata: number[], colordata: string[]) {
    const ctx = document.getElementById('doughnutchart') as HTMLCanvasElement;

    // Check if a chart instance already exists and destroy it
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: valuedata,
          backgroundColor: colordata,
        }],
        // labels: labeldata 
      },
    });

    // After rendering the chart, add the labels dynamically
    this.addLabelsToChart(labeldata, colordata, valuedata);
  }


  addLabelsToChart(labeldata: string[], colordata: string[], valuedata: number[]) {
    const chartContainer = document.getElementById('chart-labels-container');

    // Clear any previous labels
    if (chartContainer) chartContainer.innerHTML = '';

    labeldata.forEach((label, index) => {
      const labelElement = document.createElement('div');
      labelElement.classList.add('label-item');

      const colorBox = document.createElement('div');
      colorBox.style.backgroundColor = colordata[index];
      colorBox.classList.add('color-box');

      const text = document.createElement('span');
      text.textContent = `${label}: ${valuedata[index]}`;

      labelElement.appendChild(colorBox);
      labelElement.appendChild(text);
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

      if (booking.paymentStatus === "HalfPaid" && booking.tripStatus === "Completed") {
        statusBooking = this.myBookings.find((b) => b.status === 'Pending');
      } else if (booking.paymentStatus === 'HalfPaid') {
        statusBooking = this.myBookings.find((b) => b.status === 'HalfPaid');
      } else if (booking.paymentStatus === 'Completed' || booking.paymentStatus === 'Paid') {
        statusBooking = this.myBookings.find((b) => b.status === 'Completed' || b.status === 'Paid');
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

  showBookingDetails(bookingId: string): void {
    const modalRef = this.modalService.open(ShowBookingDetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });

    modalRef.componentInstance.bookingId = bookingId;
  }

  getTranslatedName(name: string): string {
    const categories = ['vehicleName', 'busNames', 'equipmentName', 'specialUnits'];
    for (let category of categories) {
      const translationKey = `${category}.${name}`;
      if (this.translate.instant(translationKey) !== translationKey) {
        return this.translate.instant(translationKey);
      }
    }
    return name; 
  }
}
