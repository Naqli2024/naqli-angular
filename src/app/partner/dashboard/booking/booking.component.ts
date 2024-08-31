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
        if (this.partner && this.partner.bookingRequest) {
          // Process booking requests directly from the partner object
          this.partner.bookingRequest.forEach((booking: any) => {
            if (booking.bookingId) {
              // Collect booking IDs
              this.bookingRequests.push(booking.bookingId);
              // Collect quote prices
              this.quotePrice.push({
                bookingId: booking.bookingId.toString(),
                quotePrice: booking.quotePrice,
              });
            }
          });
  
          // Proceed to fetch bookings by booking IDs
          if (this.bookingRequests.length) {
            this.getBookingsByBookingId();
          }
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch partner details');
        console.error('Error fetching partner details', error);
      }
    );
  }

  getBookingsByBookingId() {
    const bookingObservables = this.bookingRequests.map((bookingId: string) =>
      this.bookingService.getBookingsByBookingId(bookingId)
    );

    // this.spinnerService.show();
    forkJoin(bookingObservables).subscribe(
      (responses: any[]) => {
        this.spinnerService.hide();
        this.bookings = responses.map((response) => response.data);
        this.bookings = this.bookings.flat();
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
    const userIds = this.bookings
      .map((booking) => booking.user)
      .filter((value, index, self) => value && self.indexOf(value) === index);

    if (userIds.length > 0) {
      const userObservables = userIds.map((userId) =>
        this.userService.getUserById(userId)
      );
     
      forkJoin(userObservables).subscribe(
        (users: any[]) => {
          this.spinnerService.hide();
          this.users = users.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
          }, {});
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch user details');
          console.error('Error fetching user details', error);
        }
      );
    }
  }

  navigateToConfirmPayment(bookingId: string): void {
    const booking = this.bookings.find(b => b._id === bookingId);
    if (booking && (booking.paymentStatus === 'HalfPaid' || booking.paymentStatus === 'Completed' || booking.paymentStatus === 'Paid')){
      this.router.navigate(
        ['/home/partner/dashboard/booking/confirm-payment'],
        {
          queryParams: { bookingId },
        }
      );
    } else {
      this.toastr.error('User payment status not updated. Please wait!!');
    }
  }

  openPaymentConfirmation(
    partnerId: string,
    bookingId: string,
    quotePrice: number
  ) {
    this.updateQuotePrice(partnerId, bookingId, quotePrice);
  }

  updateQuotePrice(partnerId: string, bookingId: string, quotePrice: number) {
    this.spinnerService.show();
    this.partnerService
      .updateQuotePrice(partnerId, bookingId, quotePrice)
      .subscribe(
        (response) => {
          if(response.success) {
            this.spinnerService.hide();
            this.toastr.success(response.message);
          } else {
            this.toastr.error(response.message);
          }
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
        }
      );
  }

  getQuotePrice(bookingId: string): number {
    const found = this.quotePrice.find((q) => q.bookingId === bookingId);
    return found ? found.quotePrice : undefined;
  }

  setQuotePrice(newPrice: number, bookingId: string): void {
    const foundIndex = this.quotePrice.findIndex(
      (q) => q.bookingId === bookingId
    );
    if (foundIndex !== -1) {
      this.quotePrice[foundIndex].quotePrice = newPrice;
    } else {
      this.quotePrice.push({ bookingId, quotePrice: newPrice });
    }
    // Update the partner object to reflect the change in quotePrice
    this.partner.operators.forEach((operator: any) => {
      operator.bookingRequest.forEach((booking: any) => {
        if (booking.bookingId.toString() === bookingId) {
          booking.quotePrice = newPrice;
        }
      });
    });
  }

  removeBooking(partnerId: string, bookingId: string) {
    this.spinnerService.show();
    this.partnerService.deletedBookingRequest(partnerId, bookingId).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        // Optionally, remove the booking from the local bookings array
        this.bookings = this.bookings.filter(
          (booking) => booking._id !== bookingId
        );
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error(error);
      }
    );
  }
}
