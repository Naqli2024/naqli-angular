import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BookingModalComponent } from './booking-modal/booking-modal.component';
import { BusService } from '../../../../services/bus.service';
import { NgbModal, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { BookingService } from '../../../../services/booking.service';
import { MapComponent } from '../../../map/map.component';
import { Router } from '@angular/router';
import { GoogleMapsService } from '../../../../services/googlemap.service';
import { MapService } from '../../../../services/map.service';
import { User } from '../../../../models/user.model';
import { UserService } from '../../../../services/user.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bus-booking',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    BookingModalComponent,
    MapComponent,
    NgbTimepickerModule,
    TranslateModule
  ],
  templateUrl: './bus-booking.component.html',
  styleUrl: './bus-booking.component.css',
})
export class BusBookingComponent implements OnInit {
  buses: any[] = [];
  selectedBus: any = null;
  additionalLabourEnabled: boolean = false;
  public activeInputField: 'pickup' | 'dropPoint' | null = null;
  public activeDropPointIndex: number | null = null;

  bookingData: any = {
    name: '',
    unitType: '',
    time: { hour: 0, minute: 0 },
    date: '',
    productValue: '',
    pickup: '',
    dropPoints: [''],
    additionalLabour: null,
    image: '',
  };

  // Autocomplete related properties
  private autocompleteService!: google.maps.places.AutocompleteService;
  public pickupSuggestions: google.maps.places.AutocompletePrediction[] = [];
  public dropPointSuggestions: google.maps.places.AutocompletePrediction[][] =
    [];

  constructor(
    private busService: BusService,
    private modalService: NgbModal,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private bookingService: BookingService,
    private router: Router,
    private googleMapsService: GoogleMapsService,
    private mapService: MapService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.busService.getBuses().subscribe((data: any[]) => {
      this.buses = data;
      if (this.buses.length > 0) {
        this.bookingData.unitType = this.buses[0].unitType;
      }
    });

    // Define the initMap function globally before loading the script
    (window as any).initMap = () => {
      this.initializeMap();
    };

    // Load the Google Maps script
    this.googleMapsService
      .loadGoogleMapsScript()
      .then(() => {
        // Initialize the AutocompleteService after the script has loaded
        this.autocompleteService = new google.maps.places.AutocompleteService();
      })
      .catch((error) => {
        // console.error('Failed to load Google Maps script:', error);
      });
  }

  // Initialize your map
  initializeMap(): void {
    const mapOptions = {
      center: { lat: -34.397, lng: 150.644 },
      zoom: 8,
    };
    const map = new google.maps.Map(
      document.getElementById('map') as HTMLElement,
      mapOptions
    );

    // Initialize MapService with the newly created map
    this.mapService.initializeMapInContainer('map');
  }

  // Autocomplete for Pickup Input
  onPickupInputChange(): void {
    if (this.bookingData.pickup) {
      this.autocompleteService.getPlacePredictions(
        { input: this.bookingData.pickup },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            this.pickupSuggestions = predictions || [];

            // Check if 'Your Location' is already in suggestions
            const yourLocationSuggestion = {
              description: 'Your location',
              // Add other necessary properties if needed
              // For example, you might need to set a `place_id` or other fields if your logic requires
            } as google.maps.places.AutocompletePrediction;

            // Only add 'Your Location' if it's not already included
            if (
              !this.pickupSuggestions.some(
                (suggestion) => suggestion.description === 'Your Location'
              )
            ) {
              this.pickupSuggestions.unshift(yourLocationSuggestion);
            }
          } else {
            this.pickupSuggestions = [];
          }
        }
      );
    } else {
      this.pickupSuggestions = [];
    }
  }

  // Autocomplete for Drop Points
  onDropPointInputChange(index: number): void {
    const input = this.bookingData.dropPoints[index];

    // Initialize the dropPointSuggestions array at the current index if not already initialized
    if (!this.dropPointSuggestions[index]) {
      this.dropPointSuggestions[index] = [];
    }

    if (input) {
      this.autocompleteService.getPlacePredictions(
        { input: input },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            this.dropPointSuggestions[index] = predictions || [];

            // Check if 'Your Location' is already in suggestions for dropPoints
            const yourLocationSuggestion = {
              description: 'Your location',
              // Add other necessary properties if needed
              // For example, you might need to set a `place_id` or other fields if your logic requires
            } as google.maps.places.AutocompletePrediction;

            // Only add 'Your Location' if it's not already included
            if (
              !this.dropPointSuggestions[index].some(
                (suggestion) => suggestion.description === 'Your Location'
              )
            ) {
              this.dropPointSuggestions[index].unshift(yourLocationSuggestion);
            }
          } else {
            this.dropPointSuggestions[index] = [];
          }
        }
      );
    } else {
      this.dropPointSuggestions[index] = [];
    }
  }

  // Select Pickup Suggestion
  selectPickupSuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ): void {
    // Check if the selected suggestion is "Your Location"
    if (suggestion.description === 'Your location') {
      this.viewMyLocation(); // Call the method to get the user's location
    } else {
      // Update the correct field based on the active input field
      if (this.activeInputField === 'pickup') {
        this.bookingData.pickup = suggestion.description;
      } else if (
        this.activeInputField === 'dropPoint' &&
        this.activeDropPointIndex !== null
      ) {
        this.bookingData.dropPoints[this.activeDropPointIndex] =
          suggestion.description;
      }
    }

    this.pickupSuggestions = [];
  }

  // Select Drop Point Suggestion
  selectDropPointSuggestion(
    suggestion: google.maps.places.AutocompletePrediction,
    index: number
  ): void {
    if (suggestion.description === 'Your location') {
      this.viewMyLocation(); // Call the method to get the user's location and update the dropPoint
    } else {
      this.bookingData.dropPoints[index] = suggestion.description;
    }

    this.dropPointSuggestions[index] = []; // Clear the suggestions after selection
  }

  viewMyLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );

          // Use Geocoder to get the formatted address of the user's location
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: userLocation }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results[0]) {
              // Update the active input field with the user's location
              const userLocationDescription = results[0].formatted_address;

              if (this.activeInputField === 'pickup') {
                this.bookingData.pickup = userLocationDescription;
              } else if (
                this.activeInputField === 'dropPoint' &&
                this.activeDropPointIndex !== null
              ) {
                this.bookingData.dropPoints[this.activeDropPointIndex] =
                  userLocationDescription;
              }
            } else {
              this.toastr.error('Geocoder failed due to: ' + status);
            }
          });
        },
        (error) => {
          // console.error('Error getting user location:', error);
        }
      );
    } else {
      this.toastr.info('Geolocation is not supported by this browser.');
    }
  }

  setActiveInputField(
    inputType: 'pickup' | 'dropPoint',
    index: number | null = null
  ): void {
    this.activeInputField = inputType;
    this.activeDropPointIndex = index;
  }

  updateRoute(): void {
    if (this.mapService.isMapInitialized) {
      // Check if pickup and at least one drop point are set
      if (this.bookingData.pickup && this.bookingData.dropPoints.length > 0) {
        const start = this.bookingData.pickup;
        const waypoints = this.bookingData.dropPoints.slice(0, -1); // All except the last one
        const end =
          this.bookingData.dropPoints[this.bookingData.dropPoints.length - 1]; // Last drop point

        this.mapService.calculateRoute(start, waypoints, end);
      } else {
        console.error('Pickup or drop points are missing.');
      }
    } else {
      console.error('Map not initialized.');
    }
  }

  selectBus(bus: any): void {
    this.selectedBus = bus;
    this.bookingData.name = bus.name;
    this.bookingData.image = bus.image;
  }

  addInputField(): void {
    this.bookingData.dropPoints.push('');
  }

  removeInputField(index: number): void {
    if (this.bookingData.dropPoints.length > 1) {
      this.bookingData.dropPoints.splice(index, 1);
    }
  }

  toggleAdditionalLabour(event: any): void {
    this.additionalLabourEnabled = event.target.checked;
    if (!this.additionalLabourEnabled) {
      this.bookingData.additionalLabour = null;
    }
  }

  logRadioValue(event: any): void {
    this.bookingData.additionalLabour = +event.target.value;
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

  formIsValid(): boolean {
    const requiredFields = [
      { key: 'time', message: 'Please select a time' },
      { key: 'date', message: 'Please select a date' },
      { key: 'productValue', message: 'Please enter the product value' },
      { key: 'pickup', message: 'Please enter a pickup location' },
    ];

    for (let field of requiredFields) {
      const keys = field.key.split('.');
      let value = this.bookingData;

      for (let key of keys) {
        if (value === undefined || value === null) {
          this.toastr.error(field.message);
          return false;
        }
        value = value[key];
      }

      if (!value) {
        this.toastr.error(field.message);
        return false;
      }
    }

    if (!this.bookingData.dropPoints.some((dropPoint) => dropPoint.trim())) {
      this.toastr.error('Please enter at least one drop point');
      return false;
    }

    const atLeastOneBusSelected = !!this.selectedBus;
    if (!atLeastOneBusSelected) {
      this.toastr.error('Please select an option for at least one bus');
      return false;
    }

    return true;
  }

  submitBooking(): void {
    if (this.formIsValid()) {
      // Format the time before submitting the data
      this.bookingData.time = this.formatTime(this.bookingData.time);
      this.spinnerService.show();

      // Fetch userId from localStorage
      const userId = localStorage.getItem('userId');

      if (userId) {
        // Fetch the user accountType from the backend
        this.userService.getUserById(userId).subscribe(
          (user: User) => {
            // Proceed with booking creation once user data is available
            this.bookingService.createBooking(this.bookingData).subscribe(
              (response) => {
                this.spinnerService.hide();
                if (response && response._id) {
                  this.toastr.success(response.message, 'Booking Successful!');
                  this.clearForm();

                  // Set the new bookingId in localStorage, replacing the old one
                  localStorage.setItem('bookingId', response._id);

                  // Navigate based on user accountType
                  if (user.accountType === 'Super User') {
                    // Redirect to Super User dashboard
                    this.router.navigate([
                      '/home/user/dashboard/super-user/dashboard',
                    ]);
                  } else if (user.accountType === 'Single User') {
                    // Redirect to booking dashboard
                    this.router.navigate(['/home/user/dashboard/booking']);
                  }

                  // Optionally open a booking modal after navigation
                  this.openBookingModal(response._id);
                } else {
                  this.toastr.error(response.message, 'Booking Failed!');
                }
              },
              (error) => {
                this.spinnerService.hide();
                const errorMessage =
                  error.error?.message || 'An error occurred';
                this.toastr.error(errorMessage, 'Error');
                // console.log('Backend Error:', error);
              }
            );
          },
          (error) => {
            this.spinnerService.hide();
            const errorMessage =
              error.error?.message || 'Failed to retrieve user data';
            this.toastr.error(errorMessage, 'Error');
          }
        );
      } else {
        this.spinnerService.hide();
        this.toastr.error('User not logged in', 'Error');
      }
    }
  }

  private formatTime(timeObj: { hour: number; minute?: number; second?: number }): string {
    const hour = timeObj.hour || 0; // Default to 0 if undefined
    const minute = timeObj.minute !== undefined ? timeObj.minute : 0; // Default to 0 if undefined
    const modifier = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    const formattedMinute = minute < 10 ? '0' + minute : minute; // Add leading zero if needed
    return `${formattedHour}:${formattedMinute} ${modifier}`;
  }

  clearForm() {
    this.bookingData = {
      name: '',
      time: '',
      date: '',
      productValue: '',
      pickup: '',
      dropPoints: [''],
      additionalLabour: null,
      image: '',
    };
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    const clickedElement = event.target;
    const isInsideDropdown = this.isInsideDropdown(clickedElement);

    if (!isInsideDropdown) {
      this.closeAllDropdowns();
    }
  }

  private isInsideDropdown(clickedElement: any): boolean {
    // Check if the click is inside suggestions dropdown
    const suggestionsDropdown = document.querySelector('.suggestions-dropdown');
    if (suggestionsDropdown && suggestionsDropdown.contains(clickedElement)) {
      return true;
    }

    return false;
  }

  private closeAllDropdowns(): void {
    this.pickupSuggestions = [];
    this.dropPointSuggestions = [];
  }
}
