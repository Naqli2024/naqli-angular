import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Equipment, EquipmentType } from '../../../../models/equipment-booking';
import { EquipmentService } from '../../../../services/equipment.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-equipment-estimate',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './equipment-estimate.component.html',
  styleUrl: './equipment-estimate.component.css',
})
export class EquipmentEstimateComponent {
  equipment: Equipment[] = [];
  inputFields = [{ value: '' }];
  additionalLabourEnabled: boolean = false;
  optionsVisible: { [key: string]: boolean } = {};
  selectedOptions: { [key: string]: EquipmentType | null } = {};
  selectedEquipmentName: string = '';
  selectedEquipment: EquipmentType | null = null;

  bookingData = {
    fromTime: '',
    toTime: '',
    date: '',
    additionalLabour: false,
    labourCount: 0,
    city: '',
    address: '',
    zipCode: '',
    unitName: '',
    unitTypeName: '',
    unitTypeImage: '',
  };

  constructor(
    private equipmentService: EquipmentService,
    private modalService: NgbModal,
    private http: HttpClient,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.equipmentService.getEquipment().subscribe((data: Equipment[]) => {
      this.equipment = data;
    });
  }

  addInputField(): void {
    this.inputFields.push({ value: '' });
  }

  removeInputField(index: number): void {
    this.inputFields.splice(index, 1);
  }

  toggleAdditionalLabour(event: any): void {
    this.additionalLabourEnabled = event.target.checked;
  }

  selectOption(type: EquipmentType, equipName: string): void {
    this.selectedOptions[equipName] = type;
    this.closeAllDropdownsExcept(equipName);
    this.onEquipmentTypeChange(type, equipName);
    this.selectedEquipmentName = equipName;
    this.selectedEquipment = type;
    this.optionsVisible[equipName] = false;

    // Update bookingData with the selected equipment details
    this.bookingData.unitName = equipName;
    this.bookingData.unitTypeName = type.typeName;
    this.bookingData.unitTypeImage = type.typeImage;
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
    // Close all dropdowns if the click is outside the dropdown area
    const clickedElement = event.target;
    const isInsideDropdown = this.isInsideDropdown(clickedElement);

    if (!isInsideDropdown) {
      this.closeAllDropdowns();
    }
  }

  private isInsideDropdown(clickedElement: any): boolean {
    // Check if the clicked element is inside any dropdown
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
    // Close all dropdowns except the one with the given equipment name
    Object.keys(this.optionsVisible).forEach((key) => {
      if (key !== excludeEquipName) {
        this.optionsVisible[key] = false;
      }
    });
  }

  private closeAllDropdowns(): void {
    // Close all dropdowns
    Object.keys(this.optionsVisible).forEach((key) => {
      this.optionsVisible[key] = false;
    });
  }

  openBookingModal(event: MouseEvent): void {
    event.preventDefault();
    this.storeEquipmentBooking(this.bookingData);
  }

  storeEquipmentBooking(bookingData: any): void {
    this.http
      .post('http://localhost:3000/estimate', bookingData)
      .subscribe((response) => {
        this.router.navigate(['/home/user/confirm-estimate']);
      });
  }
}
