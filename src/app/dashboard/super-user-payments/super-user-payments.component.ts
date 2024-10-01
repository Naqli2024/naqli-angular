import { Component } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.prod';
import { checkoutService } from '../../../services/checkout.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-super-user-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './super-user-payments.component.html',
  styleUrl: './super-user-payments.component.css',
})

export class SuperUserPaymentsComponent {
  bookings: any[] = [];
  filteredBookings: any[] = []; 
  partnerDetails: any = {};
  selectedFilter: string = 'All';
  totalAmount: number = 0;
  oldQuotePrice: number = 0;
  paymentHandler: any = null;

  constructor(
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private checkout: checkoutService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();
    this.invokeStripe();
  }

  fetchCompletedBookings() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe((response) => {
        this.bookings = response.data;

        // Get partner details for each booking and store them in partnerDetails
        this.bookings.forEach((booking) => {
          this.getPartnerDetails(booking.partner);
        });
        this.filterBookings();
      });
    }
  }

  getPartnerDetails(partnerId: string): void {
    this.partnerService.getPartnerDetails(partnerId).subscribe((response) => {
      // Store partner details with the partnerId as key
      this.partnerDetails[partnerId] = response.data;
    });
  }

  filterBookings(): void {
    if (this.selectedFilter === 'All') {
      this.filteredBookings = this.bookings; // Show all bookings
    } else if (this.selectedFilter === 'Completed') {
      this.filteredBookings = this.bookings.filter(
        (booking) => booking.paymentStatus === "Paid" || booking.paymentStatus === "Completed"
      );
    } else if(this.selectedFilter === "Running") {
      this.filteredBookings =  this.bookings.filter(
        (booking) => booking.paymentStatus === "HalfPaid"
      )
    }
    else if(this.selectedFilter === "Pending") {
      this.filteredBookings = this.bookings.filter(
        (booking) => booking.paymentStatus === "HalfPaid" && booking.bookingStatus === "Completed"
      )
    }
  }

  onFilterChange(event: any): void {
    this.selectedFilter = event.target.value;
    this.filterBookings(); // Apply the filter
  }

  makePayment(
    event: Event,
    remainingBalance: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    event.preventDefault();

    if (
      typeof remainingBalance !== 'number' ||
      remainingBalance <= 0 ||
      !status
    ) {
      this.toastr.error('Invalid payment amount or status');
      return;
    }

    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: environment.stripePublicKey,
      locale: 'auto',
      token: (stripeToken: any) => {
        this.processPayment(
          stripeToken,
          remainingBalance,
          status,
          partnerId,
          bookingId
        );
      },
    });

    paymentHandler.open({
      name: 'Naqli',
      description: 'Naqli Transportation',
      amount: remainingBalance * 100,
    });
  }

  processPayment(
    stripeToken: any,
    remainingBalance: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    this.checkout.makePayment(stripeToken).subscribe((data: any) => {
      if (data.success && bookingId) {
        this.toastr.success(data.message);
        this.updateBookingPaymentStatus(
          bookingId,
          status,
          remainingBalance,
          partnerId
        );
        if (status === 'Completed' || status === 'HalfPaid') {
          this.router.navigate(['/home/user/dashboard/super-user/payments']);
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

  updateBookingPaymentStatus(
    bookingId: string,
    status: string,
    amount: number,
    partnerId: string
  ) {
    if (status == 'HalfPaid') {
      this.totalAmount = amount * 2;
    } else {
      this.totalAmount = amount;
    }
    this.spinnerService.show();
    this.bookingService
      .updateBookingPaymentStatus(
        bookingId,
        status,
        amount,
        partnerId,
        this.totalAmount,
        this.oldQuotePrice
      )
      .subscribe(
        (response) => {
          this.spinnerService.hide();
          this.fetchCompletedBookings();
          console.log('Booking payment status updated successfully:', response);
        },
        (error) => {
          this.spinnerService.hide();
          console.error('Error updating booking payment status:', error);
          this.toastr.error(
            error.error?.message || 'Failed to update booking payment status',
            'Error'
          );
        }
      );
  }
}
