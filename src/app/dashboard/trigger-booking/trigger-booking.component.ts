import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TriggerBookingModalComponent } from './trigger-booking-modal/trigger-booking-modal.component';
import { BookingService } from '../../../services/booking.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../services/partner/partner.service';
import { FormsModule } from '@angular/forms';
import { CancelBookingModalComponent } from './cancel-booking-modal/cancel-booking-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaymentService } from '../../../services/payment.service';
import { checkoutService } from '../../../services/checkout.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trigger-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, FontAwesomeModule],
  templateUrl: './trigger-booking.component.html',
  styleUrl: './trigger-booking.component.css',
})
export class TriggerBookingComponent {
  bookings: any[] = [];
  vendorsByBooking: any = {};
  selectedVendor: { [key: string]: any } = {};
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  checkoutId: string | null = null;
  integrity: string = '';
  showPaymentForm: boolean = false;
  shopperResultUrl: string = 'https://naqlee.com/home/user/payment-result';
  selectedBrand: string = '';
  showPaymentOptions: boolean = false;
  amount: number | undefined;
  status: string | undefined;
  partnerId: string | undefined;
  oldQuotePrice: number | undefined;
  totalAmount: number = 0;
  bookingInformation: boolean = false;
  bookingId!: string | null;

  constructor(
    private modalService: NgbModal,
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private paymentService: PaymentService,
    private checkout: checkoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchBookings();
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
        street2: false,
      },
    };
  }

  fetchBookings(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.spinnerService.show();
      this.bookingService.getBookingByUserId(userId).subscribe(
        (response: any) => {
          this.spinnerService.hide();
          if (response.success) {
            this.bookings = response.data;
            // Fetch vendors for each booking
            this.bookings.forEach((booking) => {
              this.getTopVendors(booking);
            });
          } else {
            this.toastr.error('Failed to fetch bookings');
          }
        },
        () => {
          this.spinnerService.hide();
        }
      );
    } else {
      console.error('No userId found in localStorage');
    }
  }

  // Fetch top vendors based on booking details
  getTopVendors(booking: any): void {
    const requestBody = {
      bookingId: booking._id,
      unitType: booking.unitType,
      unitClassification: booking.name,
      subClassification: booking.type.typeName,
    };
    this.spinnerService.show();

    this.partnerService.getTopPartners(requestBody).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        if (response.success) {
          this.vendorsByBooking[booking._id] = response.data.map(
            (vendor: any) => ({
              name: vendor.partnerName,
              price: vendor.quotePrice || 'N/A',
              partnerId: vendor.partnerId,
              oldQuotePrice: vendor.oldQuotePrice,
            })
          );
        } else {
          this.toastr.error('Failed to fetch vendors');
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
      }
    );
  }

  cancelBooking(bookingId: any): void {
    const modalRef = this.modalService.open(CancelBookingModalComponent, {
      size: 'md',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
    // Pass booking and vendor data to modal
    modalRef.componentInstance.bookingId = bookingId;
    modalRef.componentInstance.fetchBookings = this.fetchBookings.bind(this);
  }

  openPaymentModal(booking: any): void {
    const selectedVendor = this.selectedVendor[booking._id];
    if (!selectedVendor) {
      this.toastr.warning('Please select a vendor');
      return;
    }

    const modalRef = this.modalService.open(TriggerBookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });

    // Pass booking and vendor data to modal
    modalRef.componentInstance.booking = booking;
    modalRef.componentInstance.vendor = selectedVendor;
    // Pass fetchBookings method to modal
    modalRef.componentInstance.fetchBookings = this.fetchBookings.bind(this);
  }

  makePayment(
    event: Event,
    amount: number,
    status: string,
    partnerId: string,
    oldQuotePrice: number,
    bookingId: string
  ) {
    event.preventDefault();
    localStorage.setItem('bookingId', bookingId);

    const selectedVendor = this.selectedVendor[bookingId];
    if (!selectedVendor) {
      this.toastr.warning('Please select a vendor');
      return;
    }

    if (typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid payment amount or status');
      console.error('Invalid payment amount or status:', amount, status);
      return;
    }
    // Store the payment details globally
    this.paymentService.setPaymentDetails({
      amount,
      status,
      partnerId,
      oldQuotePrice,
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
      this.oldQuotePrice = details.oldQuotePrice;

      console.log('Payment Details:', {
        amount: this.amount,
        status: this.status,
        partnerId: this.partnerId,
        oldQuotePrice: this.oldQuotePrice,
      });
    } else {
      console.log('No payment details available');
    }

    // Check if `amount` and `selectedBrand` are defined before proceeding
    if (this.amount && this.selectedBrand && userId) {
      console.log(this.amount, this.selectedBrand);
      this.processPayment(this.amount, this.selectedBrand, userId);
    } else {
      this.toastr.error('Missing payment details');
    }
  }

  processPayment(amount: number, paymentBrand: string, userId: any) {
    console.log(amount, paymentBrand);
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
    this.bookingId = localStorage.getItem('bookingId') || '';
    const brand = localStorage.getItem('paymentBrand') ?? 'Unknown';

    this.spinnerService.show();
    if (details.status == 'HalfPaid') {
      this.totalAmount = details.amount * 2;
    } else {
      this.totalAmount = details.amount;
    }
    if (details.partnerId && details.oldQuotePrice && this.bookingId) {
      this.bookingService
        .updateBookingPaymentStatus(
          this.bookingId,
          details.status,
          details.amount,
          details.partnerId,
          this.totalAmount,
          details.oldQuotePrice
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

  openBookingDetailsModal(booking: any): void {
    const selectedVendor = this.selectedVendor[booking._id];
    if (!selectedVendor) {
      this.toastr.warning('Please select a vendor');
      return;
    }

    const modalRef = this.modalService.open(TriggerBookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });

    // Pass booking and vendor data to modal
    modalRef.componentInstance.booking = booking;
    modalRef.componentInstance.vendor = selectedVendor;
    // Pass fetchBookings method to modal
    modalRef.componentInstance.fetchBookings = this.fetchBookings.bind(this);
  }
}
