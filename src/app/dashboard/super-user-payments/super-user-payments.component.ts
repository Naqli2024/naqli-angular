import {
  Component,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.prod';
import { checkoutService } from '../../../services/checkout.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentService } from '../../../services/payment.service';
import { ShowBookingDetailsComponent } from '../super-user-dashboard/show-booking-details/show-booking-details.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-super-user-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './super-user-payments.component.html',
  styleUrl: './super-user-payments.component.css',
})
export class SuperUserPaymentsComponent implements AfterViewInit {
  @ViewChildren('.no-scroll-header', { read: ElementRef })
  tableHeaders!: QueryList<ElementRef>;

  bookings: any[] = [];
  filteredBookings: any[] = [];
  partnerDetails: any = {};
  selectedFilter: string = 'status.All';
  totalAmount: number = 0;
  oldQuotePrice: number = 0;
  paymentHandler: any = null;
  showPaymentOptions: boolean = false;
  selectedBrand: string = '';
  checkoutId: string | null = null;
  integrity: string = '';
  showPaymentForm: boolean = false;
  shopperResultUrl: string = 'https://naqlee.com/home/user/payment-result';
  amount: number | undefined;
  status: string | undefined;
  partnerId: string | undefined;
  bookingInformation: boolean = false;
  bookingId: any;

  constructor(
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private checkout: checkoutService,
    private toastr: ToastrService,
    private router: Router,
    private paymentService: PaymentService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();

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

  ngAfterViewInit(): void {
    this.tableHeaders.forEach((header) => this.preventVerticalScroll(header));
  }

  preventVerticalScroll(header: ElementRef): void {
    if (header.nativeElement.scrollHeight < 50) {
      // Example condition to prevent scroll
      header.nativeElement.style.overflowY = 'hidden';
    }
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
    if (this.selectedFilter === 'status.All') {
      this.filteredBookings = this.bookings; // Show all bookings
    } else if (this.selectedFilter === 'status.Completed') {
      this.filteredBookings = this.bookings.filter(
        (booking) =>
          booking.paymentStatus === 'Paid' ||
          booking.paymentStatus === 'Completed'
      );
    } else if (this.selectedFilter === 'paymentStatus.HalfPaid') {
      this.filteredBookings = this.bookings.filter(
        (booking) =>
          booking.paymentStatus === 'HalfPaid' &&
          booking.bookingStatus !== 'Completed' &&
          booking.tripStatus !== 'Completed'
      );
    } else if (this.selectedFilter === 'status.Pending') {
      this.filteredBookings = this.bookings.filter(
        (booking) =>
          booking.paymentStatus === 'HalfPaid' &&
          booking.tripStatus === 'Completed'
      );
    }
  }

  onFilterChange(event: any): void {
    this.selectedFilter = event.target.value;
    this.filterBookings(); // Apply the filter
  }

  makePayment(
    event: Event,
    amount: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    event.preventDefault();

    if (typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid payment amount or status');
      return;
    }

    // Store the payment details globally
    this.paymentService.setRemainingPaymentDetails({
      amount,
      status,
      partnerId,
      bookingId,
    });

    // Show the payment options (MADA or Other cards)
    this.showPaymentOptions = true;
  }

  selectPaymentBrand(brand: string) {
    this.selectedBrand = brand;
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

      // console.log('Payment Details:', {
      //   amount: this.amount,
      //   status: this.status,
      //   partnerId: this.partnerId,
      //   bookingId: this.bookingId,
      // });
    } else {
      // console.log('No payment details available');
    }

    // Check if `remainingBalance` and `selectedBrand` are defined before proceeding
    if (this.amount && this.selectedBrand && userId) {
      // console.log(this.amount, this.selectedBrand);
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
    script.src = `https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=${this.checkoutId}`;
    script.crossOrigin = 'anonymous';
    script.integrity = this.integrity;

    script.onload = () => {
      console.log('Payment widget script loaded');
    };

    // Append script to body or a specific element where the form will be displayed
    document.body.appendChild(script);
  }

  // Method to close the payment form
  closePaymentForm() {
    this.showPaymentForm = false;
  }

  closePaymentOptions() {
    this.showPaymentOptions = false;
  }

  showBookingDetails(bookingId: string): void {
    const modalRef = this.modalService.open(ShowBookingDetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });

    modalRef.componentInstance.bookingId = bookingId;
  }

  getOperatorName(partner: any, bookingId: string): string {
    if (
      partner?.type === 'singleUnit + operator' &&
      partner?.operators?.[0]?.operatorsDetail?.length > 0
    ) {
      const operator = partner.operators[0].operatorsDetail[0];
      return (
        `${operator.firstName || ''} ${operator.lastName || ''}`.trim() || 'N/A'
      );
    } else if (partner?.type === 'multipleUnits') {
      return this.getOperatorNameFromBooking(
        partner?.bookingRequest,
        bookingId
      );
    }
    return 'N/A';
  }

  getOperatorMobile(partner: any, bookingId: string): string {
    if (
      partner?.type === 'singleUnit + operator' &&
      partner?.operators?.[0]?.operatorsDetail?.length > 0
    ) {
      return partner.operators[0].operatorsDetail[0].mobileNo || 'N/A';
    } else if (partner?.type === 'multipleUnits') {
      return this.getOperatorMobileFromBooking(
        partner?.bookingRequest,
        bookingId
      );
    }
    return 'N/A';
  }

  getOperatorNameFromBooking(
    bookingRequests: any[],
    bookingId: string
  ): string {
    if (!bookingRequests) {
      console.warn('Booking requests are null or undefined');
      return 'N/A';
    }

    const booking = bookingRequests.find(
      (request) => request.bookingId === bookingId
    );

    // console.log('Found Booking:', booking);
    if (booking && booking.assignedOperator) {
      // console.log('Assigned Operator:', booking.assignedOperator);
    } else {
      console.warn(
        'Assigned Operator details are missing for booking ID:',
        bookingId
      );
    }

    return booking?.assignedOperator?.operatorName ?? 'N/A';
  }

  getOperatorMobileFromBooking(
    bookingRequests: any[],
    bookingId: string
  ): string {
    if (!bookingRequests) {
      console.warn('Booking requests are null or undefined');
      return 'N/A';
    }

    const booking = bookingRequests.find(
      (request) => request.bookingId === bookingId
    );

    if (booking && booking.assignedOperator) {
      // console.log('Assigned Operator:', booking.assignedOperator);
    } else {
      console.warn(
        'Assigned Operator details are missing for booking ID:',
        bookingId
      );
    }

    return booking?.assignedOperator?.operatorMobileNo ?? 'N/A';
  }
}
