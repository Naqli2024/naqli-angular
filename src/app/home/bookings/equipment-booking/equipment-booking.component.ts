import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EquipmentService } from '../../../../services/equipment.service';
import { Equipment, EquipmentType } from '../../../../models/equipment-booking';
import { BookingModalComponent } from '../bus-booking/booking-modal/booking-modal.component';
import { BookingService } from '../../../../services/booking.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { MapComponent } from '../../../map/map.component';

@Component({
  selector: 'app-equipment-booking',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    BookingModalComponent,
    MapComponent,
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

  bookingData: any = {
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

  constructor(
    private equipmentService: EquipmentService,
    private modalService: NgbModal,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.equipmentService.getEquipment().subscribe((data: Equipment[]) => {
      this.equipment = data;
      if (this.equipment.length > 0) {
        this.bookingData.unitType = this.equipment[0].unitType; 
      }
    });
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
    this.closeAllDropdownsExcept(equipName);
    this.onEquipmentTypeChange(type, equipName);
    this.selectedEquipmentName = equipName;
    this.optionsVisible[equipName] = false;

    this.bookingData.name = equipName;
    this.bookingData.type = [
      {
        typeName: type.typeName,
        typeImage: type.typeImage,
      },
    ];
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
    const isInsideDropdown = this.isInsideDropdown(clickedElement);

    if (!isInsideDropdown) {
      this.closeAllDropdowns();
    }
  }

  private isInsideDropdown(clickedElement: any): boolean {
    for (const equipmentName of Object.keys(this.optionsVisible)) {
      const dropdownElement = document.querySelector(
        `.custom-select-trigger[data-vehicle="${equipmentName}"]`
      );
      if (dropdownElement && dropdownElement.contains(clickedElement)) {
        return true;
      }
    }
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

  submitBooking(): void {
    this.spinnerService.show();
    this.bookingService.createBooking(this.bookingData).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        if (response && response._id) {
          this.toastr.success(response.message, 'Booking Successful!');
          this.clearForm();
          this.openBookingModal(response._id);
        } else {
          this.toastr.error(response.message || 'Booking Failed!', 'Error');
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
        console.error('Backend Error:', error);
      }
    );
  }

  clearForm() {
    this.bookingData = {
      name: '',
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
