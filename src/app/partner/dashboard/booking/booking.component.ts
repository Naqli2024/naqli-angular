import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../../services/booking.service';
import { Booking } from '../../../../models/booking.model';
import { User } from '../../../../models/user.model';
import { UserService } from '../../../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { CommonModule } from '@angular/common';
import { PartnerService } from '../../../../services/partner/partner.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css',
})
export class PartnerBookingComponent implements OnInit {
  bookings: Booking[] = [];
  users: User[] = []; // To store user details by userId
  partnerId: string = '';
  partner: any;
  quotePrice: any[] = [];

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private userService: UserService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService, 
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    if (!sessionStorage.getItem('partnerName')) {
      sessionStorage.setItem('partnerName', 'true');
      window.location.reload();
    }
    this.getAllBookings();
    this.partnerId = this.getPartnerId();
    this.getPartnerDetails();
  }

  getPartnerId(): string {
    return localStorage.getItem('partnerId') || '';
  }

  getPartnerDetails() {
    this.spinnerService.show();
    this.partnerService.getPartnerDetails(this.partnerId).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.partner = response.data;
        this.updateBookingsWithQuotePrice();
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch partner details');
        console.error('Error fetching partner details', error);
      }
    )
  }

  getAllBookings() {
    this.spinnerService.show();
    this.bookingService.getAllBookings().subscribe(
      (data: Booking[]) => {
        this.spinnerService.hide();
        this.bookings = data;
        this.fetchUsers();
      },
      (error) => {
        this.spinnerService.hide();
        console.error('Error fetching bookings', error);
      }
    );
  }

  fetchUsers() {
    this.spinnerService.show();
    this.bookings.forEach((booking) => {
      if (booking.user) {
        this.userService.getUserById(booking.user).subscribe(
          (user: User) => {
            this.users.push(user);
            this.spinnerService.hide();
          },
          (error) => {
            this.spinnerService.hide();
            this.toastr.error(error, 'Error');
          }
        );
      }
    });
  }

  openPaymentConfirmation(partnerId: string, bookingId: string, quotePrice: number) {
    this.updateQuotePrice(partnerId, bookingId, quotePrice)
  }

  updateBookingsWithQuotePrice() {
    if(this.partner && this.partner.quotePrices) {
        this.quotePrice = this.partner.quotePrices;
    }
  }

  updateQuotePrice(partnerId: string, bookingId: string, quotePrice: number) {
    this.spinnerService.show();
    this.partnerService.updateQuotePrice(partnerId, bookingId, quotePrice).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        this.router.navigate(['/home/partner/dashboard/booking/confirm-payment']);
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to update quote price');
        console.error('Error updating quote price', error);
      }
    );
  }

  getQuotePrice(bookingId: string): number {
    const found = this.quotePrice.find(q => q.bookingId === bookingId);
    return found ? found.quotePrice : undefined;
  }
  
  setQuotePrice(newPrice: number, bookingId: string): void {
    const foundIndex = this.quotePrice.findIndex(q => q.bookingId === bookingId);
    if (foundIndex !== -1) {
      this.quotePrice[foundIndex].quotePrice = newPrice;
    } else {
      this.quotePrice.push({ bookingId, quotePrice: newPrice });
    }
  }

  removeBooking(index: number) {
    this.bookings.splice(index, 1);
  }
}
