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
import { forkJoin } from 'rxjs';

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
  bookingId: string = '';
  bookingRequests: string[] = [];

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
        if (this.partner && this.partner.operators) {
          this.bookingRequests = this.partner.operators.reduce((acc, operator) => {
            if (operator.bookingRequest && operator.bookingRequest.length) {
              operator.bookingRequest.forEach((bookingId: string) => {
                acc.push(bookingId);
              });
            }
            return acc;
          }, []);
          this.getBookingsByBookingId()
        }
        this.updateBookingsWithQuotePrice();
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch partner details');
        console.error('Error fetching partner details', error);
      }
    )
  }

  getBookingsByBookingId() {
    const bookingObservables = this.bookingRequests.map((bookingId: string) => 
      this.bookingService.getBookingsByBookingId(bookingId)
    );

    // this.spinnerService.show();
    forkJoin(bookingObservables).subscribe(
      (responses: any[]) => {
        this.spinnerService.hide();
        this.bookings = responses.map(response => response.data);
        this.bookings = this.bookings.flat();
        this.fetchUsers();
        console.log(this.bookings)
      },
      (error) => {
        this.spinnerService.hide();
        console.error('Error fetching bookings', error);
      }
    );
  }

  fetchUsers() {
    // this.spinnerService.show();
    const userIds = this.bookings.map(booking => booking.user).filter((value, index, self) => value && self.indexOf(value) === index);

    if (userIds.length > 0) {
      const userObservables = userIds.map(userId => this.userService.getUserById(userId));
      this.spinnerService.show();

      forkJoin(userObservables).subscribe(
        (users: any[]) => {
          this.spinnerService.hide();
          this.users = users;
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch user details');
          console.error('Error fetching user details', error);
        }
      );
    }
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
