import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-edit-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-booking-modal.component.html',
  styleUrl: './edit-booking-modal.component.css',
})
export class EditBookingModalComponent {
  @Input() booking: any;
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
  };

  // Autocomplete related properties
  private autocompleteService!: google.maps.places.AutocompleteService;
  public pickupSuggestions: google.maps.places.AutocompletePrediction[] = [];
  public dropPointSuggestions: google.maps.places.AutocompletePrediction[][] = [];

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    // Map booking data to bookingData model
    this.bookingData = { 
      unitType: this.booking.unitType,
      name: this.booking.name,
      type: this.booking.type,
      time: this.booking.time,
      date: this.booking.date,
      productValue: this.booking.productValue,
      pickup: this.booking.pickup,
      dropPoints: this.booking.dropPoints.length ? this.booking.dropPoints : [''],
      additionalLabour: this.booking.additionalLabour
    };
    this.additionalLabourEnabled = this.booking.additionalLabour > 0;
  }

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
    console.log(this.booking)
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
