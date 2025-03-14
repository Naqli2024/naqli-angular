import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../environments/environment.prod';
import { checkoutService } from '../../../../services/checkout.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { BookingService } from '../../../../services/booking.service';
import { PartnerService } from '../../../../services/partner/partner.service';
import { BookingModalComponent } from './booking-modal/booking-modal.component';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../../services/payment.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-trigger-booking-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './trigger-booking-modal.component.html',
  styleUrl: './trigger-booking-modal.component.css',
})
export class TriggerBookingModalComponent {
  @Input() booking: any;
  @Input() vendor: any;
  @Input() fetchBookings!: () => void;
  paymentHandler: any = null;
  totalAmount: number = 0;
  partnerNo: any;
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
  bookingInformation: boolean = false;
  bookingId!: string | null;

  constructor(
    public activeModal: NgbActiveModal,
    public router: Router,
    private checkout: checkoutService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private bookingService: BookingService,
    private modalService: NgbModal,
    private partnerService: PartnerService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.getPartnerDetails();
     // Optionally get the current payment status synchronously
     const currentStatus = this.paymentService.getPaymentStatus();
    //  console.log('Current Payment Status:', currentStatus);
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

  getPartnerDetails(): void {
    if(this.vendor.partnerId) {
      this.partnerService
      .getPartnerDetails(this.vendor.partnerId)
      .subscribe((response: any) => {
        this.partnerNo = response.data.mobileNo;
      });
    } else {
        this.partnerNo = 'N/A'
    }
  }

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
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
    // console.log(bookingId)
    localStorage.setItem('bookingId', bookingId);

    if (typeof amount !== 'number' || amount <= 0 || !status || isNaN(this.vendor.price)) {
      this.toastr.error('Invalid payment amount or status. Please wait for quote price..');
      // console.error('Invalid payment amount or status:', amount, status);
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
    // console.log(this.selectedBrand);
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

      // console.log('Payment Details:', {
      //   amount: this.amount,
      //   status: this.status,
      //   partnerId: this.partnerId,
      //   oldQuotePrice: this.oldQuotePrice,
      // });
    } else {
      // console.log('No payment details available');
    }

    // Check if `amount` and `selectedBrand` are defined before proceeding
    if (this.amount && this.selectedBrand && userId) {
      // console.log(this.amount, this.selectedBrand);
      this.processPayment(this.amount, this.selectedBrand, userId);
    } else {
      this.toastr.error('Missing payment details');
    }
  }

  processPayment(amount: number, paymentBrand: string, userId: any) {
    // console.log(amount, paymentBrand);
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
    script.src = `https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=${this.checkoutId}`;
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
    // console.log(details);
    // console.log(this.bookingId);

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
            // console.log(
            //   'Booking payment status updated successfully:',
            //   response
            // );
            this.paymentService.clearPaymentDetails();
          },
          (error) => {
            // console.error('Error updating booking payment status:', error);
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


  openBookingModal(bookingId: string): void {
    const modalRef = this.modalService.open(BookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
    modalRef.componentInstance.bookingId = bookingId;
  }
}