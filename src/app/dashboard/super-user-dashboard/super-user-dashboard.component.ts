import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../services/partner/partner.service';

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

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    this.getBookingDetails();
  }

  getBookingDetails(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe((response) => {
        this.bookings = response.data;
        this.bookings.forEach((booking) => {
          this.getTopVendors(booking);
        });
      });
    }
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
