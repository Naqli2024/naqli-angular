import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { EquipmentService } from '../../../../services/equipment.service';
import { Equipment, EquipmentType } from '../../../../models/equipment-booking';
import { BookingModalComponent } from '../bus-booking/booking-modal/booking-modal.component';
import { BookingService } from '../../../../services/booking.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { MapComponent } from '../../../map/map.component';
import { Router } from '@angular/router';
import { GoogleMapsService } from '../../../../services/googlemap.service';
import { MapService } from '../../../../services/map.service';
import { User } from '../../../../models/user.model';
import { UserService } from '../../../../services/user.service';
import { TranslateModule } from '@ngx-translate/core';

interface BookingData {
  name: string;
  unitType: string;
  type: EquipmentType[];
  date: string;
  fromTime: string;
  toTime: string;
  cityName: string;
  address: string;
  zipCode: string;
  additionalLabour: number | null;
}

@Component({
  selector: 'app-equipment-booking',
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
  templateUrl: './equipment-booking.component.html',
  styleUrl: './equipment-booking.component.css',
})
export class EquipmentBookingComponent {
  equipment: Equipment[] = [];
  additionalLabourEnabled: boolean = false;
  optionsVisible: { [key: string]: boolean } = {};
  selectedOptions: { [key: string]: EquipmentType | null } = {};
  selectedEquipmentName: string = '';
  isFormSubmitted: boolean = false;
  public activeInputField: 'cityName' | 'address' | null = null;

  bookingData: any = {
    name: '',
    unitType: '',
    type: [{ typeName: '', typeImage: '' }],
    fromTime: { hour: 0, minute: 0 },
    toTime: { hour: 0, minute: 0 },
    date: '',
    cityName: '',
    address: '',
    additionalLabour: null,
  };

  public citySuggestions: google.maps.places.AutocompletePrediction[] = [];
  public addressSuggestions: google.maps.places.AutocompletePrediction[] = [];

  private autocompleteService!: google.maps.places.AutocompleteService;

  constructor(
    private equipmentService: EquipmentService,
    private modalService: NgbModal,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private router: Router,
    private googleMapsService: GoogleMapsService,
    private mapService: MapService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.equipmentService.getEquipment().subscribe((data: Equipment[]) => {
      this.equipment = data;
      this.bookingData.unitType = this.equipment[0].unitType;
    });

    // Define the initMap function globally before loading the script
    (window as any).initMap = () => {
      this.initializeMap();
    };

    // Load the Google Maps script and initialize the AutocompleteService
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

  // Method to initialize the map
  private initializeMap(): void {
    this.mapService.initializeMapInContainer('mapContainer');
  }

  onCityInputChange(): void {
    if (this.bookingData.cityName.length > 0) {
      this.autocompleteService.getPlacePredictions(
        { input: this.bookingData.cityName, types: ['(cities)'] },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            this.citySuggestions = predictions || [];
            // Check if 'Your Location' is already in suggestions
            const yourLocationSuggestion = {
              description: 'Your location',
              // Add other necessary properties if needed
              // For example, you might need to set a `place_id` or other fields if your logic requires
            } as google.maps.places.AutocompletePrediction;

            // Only add 'Your Location' if it's not already included
            if (
              !this.citySuggestions.some(
                (suggestion) => suggestion.description === 'Your Location'
              )
            ) {
              this.citySuggestions.unshift(yourLocationSuggestion);
            }
          } else {
            this.citySuggestions = [];
          }
        }
      );
    } else {
      this.citySuggestions = [];
    }
  }

  onAddressInputChange(): void {
    if (
      this.bookingData.cityName.length > 0 &&
      this.bookingData.address.length > 0
    ) {
      const input = `${this.bookingData.address}, ${this.bookingData.cityName}`;
      this.autocompleteService.getPlacePredictions(
        { input, types: ['geocode'] },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            this.addressSuggestions = predictions || [];
            // Check if 'Your Location' is already in suggestions
            const yourLocationSuggestion = {
              description: 'Your location',
              // Add other necessary properties if needed
              // For example, you might need to set a `place_id` or other fields if your logic requires
            } as google.maps.places.AutocompletePrediction;

            // Only add 'Your Location' if it's not already included
            if (
              !this.addressSuggestions.some(
                (suggestion) => suggestion.description === 'Your Location'
              )
            ) {
              this.addressSuggestions.unshift(yourLocationSuggestion);
            }
          } else {
            this.addressSuggestions = [];
          }
        }
      );
    } else {
      this.addressSuggestions = [];
    }
  }

  selectCitySuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ): void {
    // Check if the selected suggestion is "Your Location"
    if (suggestion.description === 'Your location') {
      this.viewMyLocation(); // Call the method to get the user's location
    } else {
      // Update the correct field based on the active input field
      if (this.activeInputField === 'cityName') {
        this.bookingData.cityName = suggestion.description;
      } else if (this.activeInputField === 'address') {
        this.bookingData.address = suggestion.description;
      }
    }
    this.citySuggestions = [];
  }

  selectAddressSuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ): void {
    // Check if the selected suggestion is "Your Location"
    if (suggestion.description === 'Your location') {
      this.viewMyLocation(); // Call the method to get the user's location
    } else {
      // Update the correct field based on the active input field
      if (this.activeInputField === 'cityName') {
        this.bookingData.cityName = suggestion.description;
      } else if (this.activeInputField === 'address') {
        this.bookingData.address = suggestion.description;
      }
    }
    this.addressSuggestions = [];
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

              if (this.activeInputField === 'cityName') {
                this.bookingData.cityName = userLocationDescription;
              } else if (this.activeInputField === 'address') {
                this.bookingData.address = userLocationDescription;
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

  setActiveInputField(inputType: 'cityName' | 'address'): void {
    this.activeInputField = inputType;
  }

  getLocation(): void {
    if (this.bookingData.address && this.bookingData.cityName) {
      this.mapService.markLocation(
        this.bookingData.address,
        this.bookingData.cityName
      );
    } else {
      console.error('Address is required to mark location.');
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

  selectOption(type: EquipmentType, equipName: string): void {
    this.selectedOptions[equipName] = type;
    this.bookingData.name = equipName;

    // Ensure type and typeName are valid before proceeding
    if (!type || !type.typeName || type.typeName.trim() === '') {
      console.warn('Invalid type or typeName detected.');
      return;
    }

    // Normalize typeName for comparison
    const normalizedTypeName = type.typeName.trim().toLowerCase();

    // Remove empty entries before checking for duplicates
    this.bookingData.type = this.bookingData.type.filter(
      (equip) => equip.typeName.trim() !== ''
    );

    const equipmentIndex = this.bookingData.type.findIndex(
      (equip) => equip.typeName.trim().toLowerCase() === normalizedTypeName
    );

    if (equipmentIndex !== -1) {
      // Update the existing equipment type in bookingData
      this.bookingData.type[equipmentIndex] = {
        typeName: normalizedTypeName,
        typeImage: type.typeImage,
      };
    } else {
      // Add a new equipment type to bookingData
      this.bookingData.type.push({
        typeName: normalizedTypeName,
        typeImage: type.typeImage,
      });
    }

    this.closeAllDropdownsExcept(equipName);
    this.optionsVisible[equipName] = false; // Hide options after selecting
  }

  onEquipmentTypeChange(type: EquipmentType, equipName: string): void {
    this.selectedEquipmentName = equipName;
  }

  toggleOptions(equipName: string): void {
    this.optionsVisible[equipName] = !this.optionsVisible[equipName];
    this.closeAllDropdownsExcept(equipName);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    const clickedElement = event.target;

    if (!this.isInsideDropdown(clickedElement)) {
      this.closeAllDropdowns();
    }
  }

  private isInsideDropdown(clickedElement: any): boolean {
    // Check if the click is inside equipment dropdowns
    for (const equipmentName of Object.keys(this.optionsVisible)) {
      const dropdownElement = document.querySelector(
        `.custom-select-trigger[data-vehicle="${equipmentName}"]`
      );
      if (dropdownElement && dropdownElement.contains(clickedElement)) {
        return true;
      }
    }

    // Check if the click is inside city suggestions dropdown
    const citySuggestionsDropdown = document.querySelector(
      '.suggestions-dropdown.city'
    );
    if (
      citySuggestionsDropdown &&
      citySuggestionsDropdown.contains(clickedElement)
    ) {
      return true;
    }

    // Check if the click is inside address suggestions dropdown
    const addressSuggestionsDropdown = document.querySelector(
      '.suggestions-dropdown.address'
    );
    if (
      addressSuggestionsDropdown &&
      addressSuggestionsDropdown.contains(clickedElement)
    ) {
      return true;
    }

    // Click is not inside any of the dropdowns
    return false;
  }

  private closeAllDropdownsExcept(excludeEquipName: string): void {
    Object.keys(this.optionsVisible).forEach((key) => {
      if (key !== excludeEquipName) {
        this.optionsVisible[key] = false;
      }
    });
  }

  private closeAllDropdowns(): void {
    Object.keys(this.optionsVisible).forEach((key) => {
      this.optionsVisible[key] = false;
    });
    // Optionally, you might want to clear city and address suggestions as well
    this.citySuggestions = [];
    this.addressSuggestions = [];
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
    let isValid = true;
    const errors: string[] = [];

    // Define required fields and their error messages
    const requiredFields: { key: keyof BookingData; message: string }[] = [
      { key: 'date', message: 'Please select a date' },
      { key: 'fromTime', message: 'Please select a from time' },
      { key: 'toTime', message: 'Please select a to time' },
      { key: 'cityName', message: 'Please enter city name' },
      { key: 'address', message: 'Please enter address' },
      { key: 'unitType', message: 'Please select a unit type' },
    ];

    // Check if at least one type is selected
    if (this.bookingData.type.every((type) => !type.typeName.trim())) {
      errors.push('Please select at least one equipment type');
      isValid = false;
    }

    requiredFields.forEach((field) => {
      const value = this.bookingData[field.key];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(field.message);
        isValid = false;
      }
    });

    // Show toast errors if form is invalid
    if (!isValid) {
      errors.forEach((error) => {
        this.toastr.error(error);
      });
    }

    return isValid;
  }

  submitBooking(): void {
    this.isFormSubmitted = true;
    if (this.formIsValid()) {
      this.bookingData.fromTime = this.formatTime(this.bookingData.fromTime);
      this.bookingData.toTime = this.formatTime(this.bookingData.toTime);
      this.spinnerService.show();

      // Fetch userId from localStorage
      const userId = localStorage.getItem('userId');

      if (userId) {
        // Fetch the user accountType from the backend
        this.userService.getUserById(userId).subscribe(
          (user: User) => {
            // Proceed with booking creation once user data is available
            this.bookingService.createBooking(this.bookingData).subscribe(
              (response: any) => {
                this.spinnerService.hide();
                if (response && response._id) {
                  this.toastr.success(response.message, 'Booking Successful!');
                  this.clearForm();

                  // Check if there is an existing bookingId in localStorage
                  const existingBookingId = localStorage.getItem('bookingId');
                  if (existingBookingId) {
                    // console.log(
                    //   `Replacing existing bookingId: ${existingBookingId} with new bookingId: ${response._id}`
                    // );
                  }

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
                  this.toastr.error(
                    response.message || 'Booking Failed!',
                    'Error'
                  );
                }
              },
              (error) => {
                this.spinnerService.hide();
                const errorMessage =
                  error.error?.message || 'An error occurred';
                this.toastr.error(errorMessage, 'Error');
                // console.error('Backend Error:', error);
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

  private formatTime(timeObj: {
    hour: number;
    minute?: number;
    second?: number;
  }): string {
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
      unitType: '',
      type: [{ typeName: '', typeImage: '' }],
      fromTime: '',
      toTime: '',
      date: '',
      cityName: '',
      address: '',
      zipCode: '',
      additionalLabour: null,
    };
  }
}
