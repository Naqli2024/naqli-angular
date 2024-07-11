import { Component, OnInit } from '@angular/core';
import { Booking } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../../services/spinner.service';
import { environment } from '../../../environments/environment';
import { checkoutService } from '../../../services/checkout.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit{
  bookings: Booking[] = [];
  paymentHandler: any = null;
  bookingId: any;

  constructor(
    private bookingService: BookingService,
    private toastr: ToastrService, 
    private authService: AuthService,
    private spinnerService: SpinnerService,
    private checkout: checkoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();
    this.invokeStripe();
  }

  fetchCompletedBookings() {
    this.spinnerService.show();
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getCompletedBookingsByUser(userId).subscribe(
        (response) => {
          if (response.success) {
            this.spinnerService.hide();
            this.bookings = response.data;
          } else {
            this.spinnerService.hide();
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
          console.error('Error fetching bookings:', error);
        }
      );
    } else {
      this.toastr.error('User ID not available');
    }
  }

  makePayment(event: Event, amount: number, status: string, partnerId: string) {
    event.preventDefault();

    console.log(
      'Clicked "Pay" button with amount:',
      amount,
      'and status:',
      status,
    );

    if (typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid payment amount or status');
      console.error('Invalid payment amount or status:', amount, status);
      return;
    }

    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: environment.stripePublicKey,
      locale: 'auto',
      token: (stripeToken: any) => {
        this.processPayment(stripeToken, amount, status, partnerId);
      },
    });

    paymentHandler.open({
      name: 'Naqli',
      description: 'Naqli Transportation',
      amount: amount * 100,
    });
  }

  processPayment(stripeToken: any, amount: number, status: string, partnerId: string) {
    this.checkout.makePayment(stripeToken).subscribe((data: any) => {
      if (data.success && this.bookingId) {
        this.toastr.success(data.message);
        console.log(status)
        this.updateBookingPaymentStatus(this.bookingId, status, amount, partnerId);
        if (status === 'Completed' || 'HalfPaid') {
          this.router.navigate(['/home/user/dashboard/booking-history']);
        }
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  invokeStripe() {
    if (!window.document.getElementById('stripe-script')) {
      const script = window.document.createElement('script');
      script.id = 'stripe-script';
      script.type = 'text/javascript';
      script.src = 'https://checkout.stripe.com/checkout.js';
      script.onload = () => {
        this.paymentHandler = (<any>window).StripeCheckout.configure({
          key: environment.stripePublicKey,
          locale: 'auto',
          token: (stripeToken: any) => {
            console.log(stripeToken);
          },
        });
      };
      window.document.body.appendChild(script);
    } else {
      this.paymentHandler = (<any>window).StripeCheckout.configure({
        key: environment.stripePublicKey,
        locale: 'auto',
        token: (stripeToken: any) => {
          console.log(stripeToken);
        },
      });
    }
  }

  private updateBookingPaymentStatus(
    bookingId: string,
    status: string,
    amount: number,
    partnerId: string,
  ) {
    if (!bookingId || typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid input for payment update');
      return;
    }
    this.spinnerService.show();
    this.bookingService
      .updateBookingPaymentStatus(bookingId, status, amount, partnerId)
      .subscribe(
        (response) => {
          this.spinnerService.hide();
          console.log('Booking payment status updated successfully:', response);
        },
        (error) => {
          console.error('Error updating booking payment status:', error);
          this.spinnerService.hide();
          this.toastr.error(
            error.error?.message || 'Failed to update booking payment status',
            'Error'
          );
        }
      );
  }
}
