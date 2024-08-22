import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { SpecialService } from '../../../../services/special.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-special-estimate',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './special-estimate.component.html',
  styleUrl: './special-estimate.component.css',
})
export class SpecialEstimateComponent {
  buses: any[] = [];
  selectedBus: any = null;
  fromtime: string = '';
  totime: string = '';
  productValue: string = '';
  pickupLocation: string = '';
  inputFields = [{ value: '' }];
  additionalLabourEnabled: boolean = false;
  bookingData = {
    city: '',
    address: '',
    zipCode: '',
  };

  constructor(
    private http: HttpClient,
    private busService: SpecialService,
    private modalService: NgbModal,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.busService.getSpecialUnits().subscribe((data: any[]) => {
      this.buses = data;
    });
  }

  selectBus(bus: any): void {
    this.selectedBus = bus;
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

  logRadioValue(event: any): void {
    console.log(event.target.value);
  }

  openBookingModal(event: MouseEvent): void {
    event.preventDefault();

    const bookingData = {
      unitName: this.selectedBus?.name || '',
      unitTypeImage: this.selectedBus?.image || '',
      fromtime: this.fromtime,
      totime: this.totime,
      productValue: this.productValue,
      city: this.bookingData.city,
      address: this.bookingData.address,
      zipCode: this.bookingData.zipCode,
    };

    this.storeBookingData(bookingData);
  }

  storeBookingData(bookingData: any): void {
    this.http
      .post('http://localhost:3000/estimate', bookingData)
      .subscribe((response) => {
        this.router.navigate(['/home/user/confirm-estimate']);
      });
  }
}
