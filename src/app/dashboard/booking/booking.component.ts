import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../services/booking.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService, ActiveToast, IndividualConfig } from 'ngx-toastr';
import { checkoutService } from '../../../services/checkout.service';
import { AuthService } from '../../../services/auth.service';
import { Booking } from '../../../models/booking.model';
import { PartnerService } from '../../../services/partner/partner.service';
import { MapService } from '../../../services/map.service';
import { GoogleMapsService } from '../../../services/googlemap.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { LoginComponent } from '../../auth/login/login.component';
import { ChangeDetectorRef } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Socket } from 'socket.io-client';

interface Vendor {
  name: string;
  price: number | null;
  partnerId: string;
  oldQuotePrice: number | null;
  unitName: string;
  unitClassificationName: string;
  unitSubClassificationName: string;
  operatorFirstName: string;
  operatorLastName: string;
  operatorMobileNo: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css',
})
export class BookingComponent implements OnInit {
  @ViewChild('payAdvanceModal') payAdvanceModal?: TemplateRef<any>;
  vendors: Vendor[] = [];
  bookingId!: string | null;
  @ViewChild('cancelBookingModal', { static: true }) cancelBookingModal: any;
  private modalRef: NgbModalRef | null = null;
  selectedVendor: any;
  paymentHandler: any = null;
  fetchedVendors: boolean = false;
  bookings: Booking[] = [];
  users: User | undefined;
  unitType: string = '';
  unitClassification: string = '';
  subClassification: string = '';
  polling = true;
  totalAmount: number = 0;
  bookingInformation: boolean = false;
  bookingDetails: any;
  partnerDetails: any = null;
  combinedDetails: any = null;
  private autocompleteService!: google.maps.places.AutocompleteService;
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
  operatorId: string  = '';
  public operatorLocation: { latitude: number; longitude: number } | null = null;
  private socket!: Socket; 

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private checkout: checkoutService,
    private authService: AuthService,
    private partnerService: PartnerService,
    private mapService: MapService,
    private googleMapsService: GoogleMapsService,
    private userService: UserService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.bookingId = localStorage.getItem('bookingId');
    const userId: any = localStorage.getItem('userId');

    if (!userId) {
      this.toastr.error('User ID not found. Please login');
      this.openLoginModal();
      return;
    } else {
      this.fetchUsers(userId);
    }

    if (this.bookingId) {
      this.getTopPartners();
      this.getBookings(this.bookingId);
    } else {
      this.fetchBookings();
      this.fetchBookingsWithPendingPayment(userId);
    }

    // Define the global initMap function
    (window as any).initMap = () => {
      this.initializeMap();
    };

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
    if (!sessionStorage.getItem('booking')) {
      sessionStorage.setItem('booking', 'true');
      window.location.reload();
    }
  }

  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMapsScript()
      .then(() => {
        this.autocompleteService = new google.maps.places.AutocompleteService();

        // Use MutationObserver to detect when #map is added to DOM
        const observer = new MutationObserver(() => {
          const mapContainer = document.getElementById('map');
          if (mapContainer) {
            this.initializeMap();
            observer.disconnect(); // Stop observing once #map is found
          }
        });

        // Observe changes in the DOM
        observer.observe(document.body, { childList: true, subtree: true });
      })
      .catch((error) => {
        console.error('Failed to load Google Maps script:', error);
      });
  }

  ngOnDestroy(): void {
    this.polling = false; // Stop any ongoing polling
  }

  // Initialize the map
  initializeMap(): void {
    const mapContainer = document.getElementById('map') as HTMLElement;

    if (!mapContainer) {
      console.error('Map container element not found.');
      return;
    }

    // Initialize MapService with the newly created map
    this.mapService.initializeMapInContainer('map');
    if (this.operatorId) {
      this.mapService.markDriverLocation('6703a12ec38e83b903ed29cf', this.operatorId);
    } else {
      console.error("Operator Id is null, cannot call mapservice")
    }
  }

  // Update the operator location from the socket data
  updateOperatorLocation(latitude: number, longitude: number): void {
    this.operatorLocation = { latitude, longitude };
  }

  openLoginModal(): void {
    this.modalService.open(LoginComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
  }

  fetchBookingsWithPendingPayment(userId) {
    this.bookingService.getBookingsWithPendingPayment(userId).subscribe(
      (response) => {
        if (response && response.booking) {
          this.toastr.success(response.message);
          window.location.reload();
          this.bookingId = response.booking._id;
          this.initializeMap(); // Initialize map after fetching bookings

          if (this.bookingId) {
            localStorage.setItem('bookingId', this.bookingId);
            this.getTopPartners();
          } else {
            // console.error('bookingId is null or undefined');
          }

          this.fetchBookings(); // Fetch bookings using the newly stored bookingId
        } else {
          this.toastr.error('No pending bookings found.');
        }
      },
      (error) => {
        const errorMessage =
          error?.error?.message || 'Failed to get pending bookings.';
        this.toastr.info(errorMessage);
      }
    );
  }

  fetchUsers(userId: string) {
    this.userService.getUserById(userId).subscribe(
      (response: User) => {
        this.users = response;
      },
      (error) => {
        // console.error('Error fetching user:', error);
      }
    );
  }

  updateRoute(): void {
    if (this.bookingDetails.cityName && this.bookingDetails.address) {
      this.mapService.markLocation(
        this.bookingDetails.address,
        this.bookingDetails.cityName
      );
    } else if (
      this.bookingDetails.pickup &&
      this.bookingDetails.dropPoints.length > 0
    ) {
      const start = this.bookingDetails.pickup;
      const waypoints = this.bookingDetails.dropPoints.slice(0, -1); // All except the last one
      const end =
        this.bookingDetails.dropPoints[
          this.bookingDetails.dropPoints.length - 1
        ]; // Last drop point
      this.mapService.calculateRoute(start, waypoints, end);
    }
    // If neither condition is met, log an error
    else {
      // console.error(
      //   'Either pickup and drop points, or address and cityName are required.'
      // );
    }
  }

  getTopPartners() {
    if (!this.bookingId) {
      // console.error('Booking ID is not available.');
      return;
    }

    this.spinnerService.show();
    this.bookingService.getBookingsByBookingId(this.bookingId).subscribe(
      (response) => {
        if (response.success) {
          this.spinnerService.hide();
          const bookingData = response.data;
          this.unitType = bookingData.unitType;
          this.unitClassification = bookingData.name;
          this.subClassification = bookingData.type?.[0]?.typeName || '';

          const requestBody = {
            unitType: this.unitType,
            unitClassification: this.unitClassification,
            subClassification: this.subClassification,
            bookingId: this.bookingId,
          };

          if (
            bookingData.paymentStatus === 'HalfPaid' ||
            bookingData.paymentStatus === 'Completed' ||
            bookingData.paymentStatus === 'Paid'
          ) {
            this.bookingInformation = true;
            return;
          } else {
            this.pollForQuotePrices(requestBody);
            this.showFindingOperatorsMessage();
          }

          this.partnerService.getTopPartners(requestBody).subscribe(
            (response) => {
              if (response.success) {
                this.vendors = response.data
                  .filter((vendor: any) => vendor.bookingId === this.bookingId)
                  .map((vendor: any) => ({
                    name: vendor.partnerName,
                    price: vendor.quotePrice,
                    partnerId: vendor.partnerId,
                    oldQuotePrice: vendor.oldQuotePrice,
                  }));
              } else {
                this.toastr.info('No filtered vendors found.');
              }
            },
            (error) => {
              this.toastr.error('Failed to fetch top partners', error);
            }
          );
        } else {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch bookings', error);
      }
    );
  }

  showFindingOperatorsMessage() {
    return this.toastr.info(
      'Wait for a while... Finding operators',
      'Message',
      {
        timeOut: 5000,
        progressBar: true,
        progressAnimation: 'increasing',
        onHidden: () => {
          if (this.polling) {
            this.toastr.info('Still searching for vendors...', 'Message', {
              disableTimeOut: true, // Keep the message displayed
              progressBar: true,
              progressAnimation: 'increasing',
            });
          }
        },
      } as Partial<IndividualConfig<any>>
    );
  }

  pollForQuotePrices(requestBody: any) {
    const pollInterval = 5000; // Poll every 5 seconds
    const pollTimeout = 15 * 1000; // 15 seconds in milliseconds
    let numVendorsNeeded = 3; // Number of vendors needed
    let numVendorsFetched = 0; // Number of vendors with prices fetched
    let toastrRef: ActiveToast<any> | undefined; // Store the ActiveToast reference
    let successToastShown = false; // To keep track if success message was shown

    // Check if bookingId is present
    if (!this.bookingId) {
      this.toastr.error(
        'No booking ID found. Cannot start polling for vendors.'
      );
      return; // Exit the function if no bookingId is present
    }

    const poll = () => {
      if (this.polling && !this.bookingInformation) {
        if (!toastrRef && !successToastShown) {
          // Show initial Toastr message if not already shown and success message has not been shown
          toastrRef = this.showFindingOperatorsMessage();
        } else if (numVendorsFetched > 0 && toastrRef) {
          // Update the Toastr message with the number of vendors fetched
          this.toastr.clear(toastrRef.toastId);
          toastrRef = this.toastr.info(
            `Found ${numVendorsFetched} out of ${numVendorsNeeded} vendors. Continuing to search...Wait for a while...`,
            'Message',
            {
              disableTimeOut: true, // Keep the message displayed
              progressBar: true,
              progressAnimation: 'increasing',
            }
          );
        }

        this.spinnerService.show(); // Show loading spinner

        this.partnerService.getTopPartners(requestBody).subscribe(
          (response) => {
            this.spinnerService.hide(); // Hide loading spinner

            if (response.success) {
              const vendorsWithPrices = response.data.filter(
                (vendor: any) => vendor.quotePrice !== null
              );
              if (vendorsWithPrices.length > 0) {
                this.vendors = vendorsWithPrices.map((vendor: any) => ({
                  name: vendor.partnerName,
                  price: vendor.quotePrice,
                  partnerId: vendor.partnerId,
                  oldQuotePrice: vendor.oldQuotePrice,
                }));

                // Count how many vendors with prices have been fetched
                numVendorsFetched = this.vendors.length;

                // Check if we have fetched enough vendors
                if (numVendorsFetched >= numVendorsNeeded) {
                  this.polling = false; // Stop polling
                  this.fetchedVendors = true;
                  if (toastrRef) {
                    this.toastr.clear(toastrRef.toastId); // Clear the Toastr message
                  }
                  this.toastr.success('Select your vendor and make a payment');
                  successToastShown = true; // Set the flag indicating success message was shown
                } else {
                  setTimeout(poll, pollInterval); // Continue polling
                }
              } else {
                setTimeout(poll, pollInterval); // No vendors found, continue polling
              }
            } else {
              this.toastr.info('No filtered vendors found.');
              setTimeout(poll, pollInterval); // Response not successful, continue polling
            }
          },
          (error) => {
            this.spinnerService.hide(); // Hide loading spinner on error
            if (toastrRef) {
              this.toastr.clear(toastrRef.toastId); // Clear the Toastr message on error
            }
            this.toastr.error('Failed to fetch top partners', error);
            this.polling = false; // Stop polling on error
          }
        );
      }
    };

    // Set a timeout to stop polling after 3 minutes
    setTimeout(() => {
      this.polling = false; // Stop polling
      if (toastrRef) {
        this.toastr.clear(toastrRef.toastId); // Clear the Toastr message
      }
      this.fetchedVendors = true;
      this.toastr.info('Now these vendors are only available. You can select.');
    }, pollTimeout);

    this.polling = true; // Start polling
    poll(); // Start polling initially
  }

  fetchBookings() {
    this.spinnerService.show();
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe(
        (response) => {
          this.spinnerService.hide();
          if (response.success) {
            this.bookings = response.data;
            if (
              this.bookings.length > 0 &&
              this.bookings[0].bookingStatus !== 'Completed' &&
              this.bookings[0].paymentStatus !== 'NotPaid'
            ) {
              localStorage.setItem('bookingId', this.bookings[0]._id);
              this.bookingId = this.bookings[0]._id;
              this.bookingInformation = true;
              window.location.reload();
            }
            this.initializeMap(); // Initialize map after fetching bookings
          } else {
            this.spinnerService.hide();
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
          // console.error('Error fetching bookings:', error);
        }
      );
    } else {
      this.spinnerService.hide();
      this.toastr.error('User ID not available');
    }
  }

  onSelect(vendor: any) {
    if (this.fetchedVendors) {
      this.selectedVendor = vendor;
    }
  }

  openBookingCancelModal(event: Event): void {
    event.preventDefault();
    this.modalRef = this.modalService.open(this.cancelBookingModal);
    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm') {
          this.cancelBooking();
        }
      },
      (reason) => {
        // console.log('Modal dismissed:', reason);
      }
    );
  }

  confirmCancelBooking(modal: NgbModalRef, action: string): void {
    if (action === 'confirm') {
      modal.close('confirm');
    } else {
      modal.dismiss('cancel');
    }
  }

  private cancelBooking(): void {
    if (this.bookingId) {
      this.spinnerService.show();
      this.bookingService.cancelBooking(this.bookingId).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message);
          window.location.href = '/home/user';
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error(
            error.error?.message || 'Failed to cancel booking',
            'Error'
          );
          // console.error('Error cancelling booking:', error);
        }
      );
    } else {
      this.spinnerService.hide();
      this.toastr.error('Booking ID is not available', 'Error');
    }
  }

  openPayAdvanceModal(event: Event) {
    event.preventDefault();
    if (this.payAdvanceModal) {
      this.modalService.open(this.payAdvanceModal, { centered: true });
    }
  }

  makePayment(
    event: Event,
    amount: number,
    status: string,
    partnerId: string,
    oldQuotePrice: number
  ) {
    event.preventDefault();

    if (typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid payment amount or status');
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
    } else {
      // console.log('No payment details available');
    }

    // Check if `amount` and `selectedBrand` are defined before proceeding
    if (this.amount && this.selectedBrand && userId) {
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

  getBookings(bookingId: string): void {
    // this.spinnerService.show();
    this.bookingService.getBookingsByBookingId(bookingId).subscribe(
      (response) => {
        if (response.success) {
          this.bookingDetails = response.data;
          this.getPartnerDetails(this.bookingDetails.partner);
        } else {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch bookings', error);
      }
    );
  }

  getPartnerDetails(partnerId: string): void {
    this.partnerService.getPartnerDetails(partnerId).subscribe(
      (response) => {
        if (response.success) {
          this.partnerDetails = response.data;
          this.combineBookingAndPartnerDetails();
          this.spinnerService.hide();
          //call collectOperatorId 
        this.collectOperatorId();
        this.initializeMap();
        } else {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch partner details');
        }
      },
      (error) => {
        this.spinnerService.hide();
      }
    );
  }

  combineBookingAndPartnerDetails(): void {
    if (
      this.partnerDetails.operators &&
      this.partnerDetails.operators.length > 0
    ) {
      const operator = this.partnerDetails.operators[0]; // Assuming you want the first operator
      this.combinedDetails = {
        booking: this.bookingDetails,
        partner: {
          ...this.partnerDetails,
          operatorFirstName: operator.firstName,
          operatorLastName: operator.lastName,
          operatorMobileNo: operator.mobileNo,
          unitClassificationName: operator.unitClassification,
          unitSubClassificationName: operator.subClassification,
        },
      };
    } else {
      this.combinedDetails = {
        booking: this.bookingDetails,
        partner: this.partnerDetails,
      };
    }
  }

  createBooking() {
    this.router.navigate(['/home/user']);
  }

  collectOperatorId(): void {
    console.log("combinedDetails:",this.combinedDetails)
    
    if (
      this.combinedDetails?.partner?.type === 'singleUnit + operator' &&
      this.combinedDetails?.partner?.operators?.[0]?.operatorsDetail?.length > 0
    ) {
      this.operatorId =
        this.combinedDetails.partner.operators[0].operatorsDetail[0]._id;
        console.log("OperatorId:", this.operatorId)
    } else if (this.combinedDetails?.partner?.type === 'multipleUnits') {
      this.operatorId = this.getOperatorIdFromBooking(
        this.combinedDetails?.partner?.bookingRequest,
        this.bookingId! // bookingId must be present here
      );
      console.log('Collected operatorId:', this.operatorId);

    if (!this.operatorId || this.operatorId === 'N/A') {
      this.toastr.info('OperatorId not found');
    }
    }

    if (!this.operatorId || this.operatorId === 'N/A') {
      console.warn('OperatorId not found');
    }
  }

  getOperatorIdFromBooking(bookingRequests: any[], bookingId: string): string {
    if (!bookingRequests) {
      this.toastr.info('Booking requests are null or undefined');
      return 'N/A';
    }

    const booking = bookingRequests.find(
      (request) => request.bookingId === bookingId
    );

    return booking?.assignedOperator?.operatorId ?? 'N/A';
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

  // Method to close the payment form
  closePaymentForm() {
    this.showPaymentForm = false;
  }

  closePaymentOptions() {
    this.showPaymentOptions = false;
  }

  getTranslatedName(name: string): string {
    const categories = [
      'vehicleName',
      'busNames',
      'equipmentName',
      'specialUnits',
    ];
    for (let category of categories) {
      const translationKey = `${category}.${name}`;
      if (this.translate.instant(translationKey) !== translationKey) {
        return this.translate.instant(translationKey);
      }
    }
    return name;
  }

  getTranslatedTypeName(unitSubClassificationName: string): string {
    if (!unitSubClassificationName) {
      return '';
    }

    // Check if the type exists in typeNames
    if (
      this.translate.instant('typeNames.' + unitSubClassificationName) !==
      'typeNames.' + unitSubClassificationName
    ) {
      return 'typeNames.' + unitSubClassificationName;
    }

    // Check if the type exists in equipmentTypeName
    if (
      this.translate.instant(
        'equipmentTypeName.' + unitSubClassificationName
      ) !==
      'equipmentTypeName.' + unitSubClassificationName
    ) {
      return 'equipmentTypeName.' + unitSubClassificationName;
    }

    return '';
  }
}
