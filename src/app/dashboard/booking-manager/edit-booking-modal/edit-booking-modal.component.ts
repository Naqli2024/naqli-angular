import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { GoogleMapsService } from '../../../../services/googlemap.service';
import { MapService } from '../../../../services/map.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './edit-booking-modal.component.html',
  styleUrl: './edit-booking-modal.component.css',
})
export class EditBookingModalComponent {
  @Input() booking: any;
  @Input() refreshBookings?: () => void;
  additionalLabourEnabled: boolean = false;
  items = [
    {
      image: 'assets/images/vehicle.svg',
      name: 'vehicle',
    },
    { image: 'assets/images/bus.svg', name: 'bus' },
    {
      image: 'assets/images/equipment.svg',
      name: 'equipment',
    },
    {
      image: 'assets/images/special.svg',
      name: 'special',
    },
    {
      image: 'assets/images/others.svg',
      name: 'others',
    },
  ];

  bookingData: any = {
    unitType: '',
    name: '',
    type: [{ typeName: '', scale: '', typeImage: '', typeOfLoad: '' }],
    time: '',
    date: '',
    productValue: '',
    pickup: '',
    dropPoints: [''],
    additionalLabour: null,
    fromTime: '',
    toTime: ''
  };

  // Autocomplete related properties
  private autocompleteService!: google.maps.places.AutocompleteService;
  public pickupSuggestions: google.maps.places.AutocompletePrediction[] = [];
  public dropPointSuggestions: google.maps.places.AutocompletePrediction[][] =
    [];
    public cityNameSuggestions: google.maps.places.AutocompletePrediction[] = [];
  public addressSuggestions: google.maps.places.AutocompletePrediction[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private bookingService: BookingService,
    private toastr: ToastrService,
    private googleMapsService: GoogleMapsService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    // Ensure that booking exists
    if (this.booking) {
      // Map booking data to bookingData model
      this.bookingData = {
        unitType: this.booking.unitType || '',
        name: this.booking.name || '',
        type: this.booking.type || '',
        time: this.booking.time || '',
        date: this.booking.date || '',
        productValue: this.booking.productValue || 0,
        pickup: this.booking.pickup || '',
        dropPoints:
          Array.isArray(this.booking.dropPoints) &&
          this.booking.dropPoints.length
            ? this.booking.dropPoints
            : [''], // Fallback to [''] if dropPoints is not an array or empty
        additionalLabour: this.booking.additionalLabour || 0,
      };
      this.additionalLabourEnabled = this.booking.additionalLabour > 0;
    }

    // Load the Google Maps script
    this.googleMapsService
      .loadGoogleMapsScript()
      .then(() => {
        // Initialize the AutocompleteService after the script has loaded
        this.autocompleteService = new google.maps.places.AutocompleteService();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps script:', error);
      });
  }

  // Method to update booking
  updateBooking(): void {
    const bookingId = this.booking._id;

    this.bookingService.updateBooking(bookingId, this.bookingData).subscribe({
      next: (response) => {
        this.toastr.success(response.message);
        this.activeModal.close('success');
        if (this.refreshBookings) {
          this.refreshBookings();
        }
      },
      error: (error) => {
        this.toastr.error('Failed to update booking. Please try again.');
      },
    });
  }

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }

  // Autocomplete for Pickup Input
  onPickupInputChange(): void {
    if (this.bookingData.pickup) {
      this.autocompleteService.getPlacePredictions(
        { input: this.bookingData.pickup },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            this.pickupSuggestions = predictions || [];
          } else {
            this.pickupSuggestions = [];
          }
        }
      );
    } else {
      this.pickupSuggestions = [];
    }
  }

  onCityNameInputChange(): void {
    if (this.bookingData.cityName) {
      this.autocompleteService.getPlacePredictions(
        { input: this.bookingData.cityName }, 
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            this.cityNameSuggestions = predictions || [];
          } else {
            this.cityNameSuggestions = [];
          }
        }
      );
    } else {
      this.cityNameSuggestions = [];
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
          } else {
            this.dropPointSuggestions[index] = [];
          }
        }
      );
    } else {
      this.dropPointSuggestions[index] = [];
    }
  }

  onAddressInputChange(): void {
    if (this.bookingData.address) {
      this.autocompleteService.getPlacePredictions(
        { input: this.bookingData.address },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            this.addressSuggestions = predictions || [];
          } else {
            this.addressSuggestions = [];
          }
        }
      );
    } else {
      this.addressSuggestions = [];
    }
  }

  // Select Pickup Suggestion
  selectPickupSuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ): void {
    this.bookingData.pickup = suggestion.description;
    this.pickupSuggestions = [];
  }

  // Select Drop Point Suggestion
  selectDropPointSuggestion(
    suggestion: google.maps.places.AutocompletePrediction,
    index: number
  ): void {
    this.bookingData.dropPoints[index] = suggestion.description;
    this.dropPointSuggestions[index] = [];
  }

   // Select City Name Suggestion
   selectCityNameSuggestion(suggestion: google.maps.places.AutocompletePrediction): void {
    this.bookingData.cityName = suggestion.description;
    this.cityNameSuggestions = [];
  }

  // Select Address Suggestion
  selectAddressSuggestion(suggestion: google.maps.places.AutocompletePrediction): void {
    this.bookingData.address = suggestion.description;
    this.addressSuggestions = [];
  }

  addInputField(): void {
    this.bookingData.dropPoints.push('');
  }

  removeInputField(index: number): void {
    if (this.bookingData.dropPoints.length > 1) {
      this.bookingData.dropPoints.splice(index, 1);
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  toggleAdditionalLabour(event: any): void {
    this.additionalLabourEnabled = event.target.checked;
    if (!this.additionalLabourEnabled) {
      this.bookingData.additionalLabour = null;
    }
  }

  logRadioValue(event: any): void {
    this.bookingData.additionalLabour = +event.target.value; // Update additionalLabour
  }
}
