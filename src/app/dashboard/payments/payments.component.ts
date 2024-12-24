import { Component, OnInit } from '@angular/core';
import { Booking } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../../services/spinner.service';
import { environment } from '../../../environments/environment.prod';
import { checkoutService } from '../../../services/checkout.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
})
export class PaymentsComponent implements OnInit {
  bookings: Booking[] = [];
  paymentHandler: any = null;
  bookingId: any;
  totalAmount: number = 0;
  oldQuotePrice: number = 0;
  bookingInformation: boolean = false;
  showPaymentOptions: boolean = false;
  selectedBrand: string = '';
  checkoutId: string | null = null;
  integrity: string = '';
  showPaymentForm: boolean = false;
  shopperResultUrl: string = 'https://naqlee.com/home/user/payment-result';
  amount: number | undefined;
  status: string | undefined;
  partnerId: string | undefined;

  constructor(
    private bookingService: BookingService,
    private toastr: ToastrService,
    private authService: AuthService,
    private spinnerService: SpinnerService,
    private checkout: checkoutService,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();

      // Optionally get the current payment status synchronously
      const currentStatus = this.paymentService.getPaymentStatus();
      console.log('Current Payment Status:', currentStatus);
      if (currentStatus === 'Payment Successful!') {
        this.updateBookingPaymentStatus();
      }
  
       // Define the wpwlOptions in TypeScript
       window['wpwlOptions'] = {
        billingAddress: {},
        mandatoryBillingFields: {
          country: true,
          state: true,
          city: true,
          postcode: true,
          street1: true,
          street2: false
        }
      };
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

  makePayment(
    event: Event,
    amount: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    event.preventDefault();

    if (
      typeof amount !== 'number' ||
      amount <= 0 ||
      !status
    ) {
      this.toastr.error('Invalid payment amount or status');
      return;
    }

    // Store the payment details globally
    this.paymentService.setRemainingPaymentDetails({
    amount,
    status,
    partnerId,
    bookingId
    });

    // Show the payment options (MADA or Other cards)
    this.showPaymentOptions = true;
  }

  selectPaymentBrand(brand: string) {
    this.selectedBrand = brand;
    console.log(this.selectedBrand);
    this.showPaymentOptions = false;
    this.showPaymentForm = true;
    const details = this.paymentService.getPaymentDetails();
    const userId: any = localStorage.getItem('userId');

    if (details) {
      // Access individual properties
      this.amount = details.amount;
      this.status = details.status;
      this.partnerId = details.partnerId;
      this.bookingId = details.bookingId;

      console.log('Payment Details:', {
        amount: this.amount,
        status: this.status,
        partnerId: this.partnerId,
        bookingId: this.bookingId,
      });
    } else {
      console.log('No payment details available');
    }

    // Check if `remainingBalance` and `selectedBrand` are defined before proceeding
    if (this.amount && this.selectedBrand && userId) {
      console.log(this.amount, this.selectedBrand);
      this.processPayment(this.amount, this.selectedBrand, userId);
    } else {
      this.toastr.error('Missing payment details');
    }
  }

  processPayment(amount: number, paymentBrand: string, userId: any) {
    this.checkout.createPayment(amount, paymentBrand, userId).subscribe(
      (data: any) => {
        this.checkoutId = data.id; // Adjust according to your response structure
        localStorage.setItem('paymentBrand', paymentBrand);
        this.integrity = data.integrity; // Adjust according to your response structure
        this.showPaymentForm = true;

        // Inject the payment widget script into the DOM dynamically
        this.loadPaymentScript();
      },
      (error) => {
        // Handle errors during payment creation
        this.toastr.error('Error creating payment', error);
      }
    );
  }

  // This method should be called when the user submits the payment form
  onPaymentFormSubmit() {
    // Ensure that checkoutId is available
    if (!this.checkoutId) {
      this.toastr.error('Checkout ID is not available. Please try again.');
      return;
    }

    // Ensure that paymentBrand is available
    if (!this.selectedBrand) {
      this.toastr.error('Payment Brand is not selected. Please try again.');
      return;
    }

    setTimeout(() => {
      this.router.navigate(['home/user/payment-result'], {
        queryParams: {
          checkoutId: this.checkoutId,
        },
      });
    }, 100);
  }


  // Function to dynamically load the payment widget script
  loadPaymentScript() {
    const script = document.createElement('script');
    script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${this.checkoutId}`;
    script.crossOrigin = 'anonymous';
    script.integrity = this.integrity;

    script.onload = () => {
      console.log('Payment widget script loaded');
    };

    // Append script to body or a specific element where the form will be displayed
    document.body.appendChild(script);
  }

  private updateBookingPaymentStatus() {
    const details = this.paymentService.getPaymentDetails();
    const brand = localStorage.getItem('paymentBrand') ?? 'Unknown';
    console.log(details);

    this.spinnerService.show();
    if (details.status == 'HalfPaid') {
      this.totalAmount = details.amount * 2;
    } else {
      this.totalAmount = details.amount;
    }
    if (details.partnerId && details.bookingId) {
      this.bookingService
        .updateBookingPaymentStatus(
          details.bookingId,
          details.status,
          details.amount,
          details.partnerId,
          this.totalAmount,
          this.oldQuotePrice
        )
        .subscribe(
          (response) => {
            this.spinnerService.hide();
            this.bookingInformation = true;
            console.log(
              'Booking payment status updated successfully:',
              response
            );
            if (response && response.booking && response.booking._id) {
              // Call the second API to update the payment brand
              this.bookingService.updateBookingForPaymentBrand(response.booking._id, brand)
                .subscribe(
                  (brandResponse) => {
                    console.log('Booking payment brand updated successfully:', brandResponse);
                  },
                  (brandError) => {
                    console.error('Error updating booking payment brand:', brandError);
                    this.toastr.error(
                      brandError.error?.message || 'Failed to update booking payment brand',
                      'Error'
                    );
                  }
                );
            } else {
              console.error('Invalid response structure:', response);
              this.toastr.error('Failed to retrieve booking ID from the response', 'Error');
            }
            this.paymentService.clearPaymentDetails();
            localStorage.removeItem('paymentBrand');
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

    // Method to close the payment form
    closePaymentForm() {
      this.showPaymentForm = false;
    }
  
    closePaymentOptions() {
      this.showPaymentOptions = false;
    }
}
