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
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentConfirmationComponent, TranslateModule],
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
  public shouldShow: boolean = false;

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
          this.partner.bookingRequest.forEach((booking: any) => {
            if (booking.bookingId && booking.bookingStatus !== 'Completed') {
              this.bookingRequests.push(booking.bookingId);
              this.quotePrice.push({
                bookingId: booking.bookingId.toString(),
                quotePrice: booking.quotePrice,
              });
            }
          });
  
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
  
    forkJoin(bookingObservables).subscribe(
      (responses: any[]) => {
        this.spinnerService.hide(); // Hide spinner once response is received
        // Flatten the bookings from all responses
        this.bookings = responses.map((response) => response.data).flat();
  
        // Loop through bookings to check the condition for calling navigate or showing table
        this.bookings.forEach((booking) => {
          if (
            this.partner.type === 'singleUnit + operator' && 
            booking.bookingStatus !== 'Completed' &&
            (booking.paymentStatus === 'HalfPaid' ||
              booking.paymentStatus === 'Paid' || 
              booking.paymentStatus === 'Completed')
          ) {
            this.navigateToConfirmPayment(booking._id);
          }
        });
  
        if (this.bookings.length > 0) {
          this.fetchUsers(); 
        } else {
          this.spinnerService.hide(); 
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Error fetching bookings', 'Error');
        console.error('Error fetching bookings', error);
      }
    );
  }

  fetchUsers() {
    const userIds = this.bookings
      .map((booking) => booking.user)
      .filter((value, index, self) => value && self.indexOf(value) === index);
  
    if (userIds.length > 0) {
      const userObservables = userIds.map((userId) =>
        this.userService.getUserById(userId)
      );
  
      forkJoin(userObservables).subscribe(
        (users: any[]) => {
          this.spinnerService.hide(); // Hide spinner after users are fetched
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
    } else {
      // If no users to fetch, ensure spinner is hidden
      this.spinnerService.hide();
      this.toastr.warning('No users to fetch');
    }
  }

  navigateToConfirmPayment(bookingId: string): void {
    const booking = this.bookings.find((b) => b._id === bookingId);
    if (
      booking &&
      (booking.paymentStatus === 'HalfPaid' ||
        booking.paymentStatus === 'Completed' ||
        booking.paymentStatus === 'Paid')
    ) {
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
          if (response.success) {
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
