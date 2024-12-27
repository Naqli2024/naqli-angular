import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusService } from '../../../../services/bus.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bus-estimate',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, TranslateModule],
  templateUrl: './bus-estimate.component.html',
  styleUrl: './bus-estimate.component.css'
})
export class BusEstimateComponent {
  buses: any[] = [];
  selectedBus: any = null;
  selectedTime: string = '';
  selectedDate: string = '';
  productValue: string = '';
  pickupLocation: string = '';
  inputFields = [{ value: '' }];
  additionalLabourEnabled: boolean = false;

  constructor(
    private http: HttpClient,
    private busService: BusService,
    private modalService: NgbModal,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.busService.getBuses().subscribe((data: any[]) => {
      this.buses = data;
      console.log(data);
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
      time: this.selectedTime,
      date: this.selectedDate,
      productValue: this.productValue,
      pickup: this.pickupLocation,
      dropPoints: this.inputFields.map((field) => field.value),
    };
    console.log(bookingData)
    this.storeBookingData(bookingData);
  }

  storeBookingData(bookingData: any): void {
    this.http.post('http://localhost:3000/estimate', bookingData).subscribe(
      (response) => {
        this.router.navigate(['/home/user/confirm-estimate']);
      }
    );
  }
}
