import { Component } from '@angular/core';
import { BookingModalComponent } from '../../bookings/bus-booking/booking-modal/booking-modal.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstimateService } from '../../../../services/estimate.service';

@Component({
  selector: 'app-confirm-estimate',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, BookingModalComponent],
  templateUrl: './confirm-estimate.component.html',
  styleUrl: './confirm-estimate.component.css'
})
export class ConfirmEstimateComponent {
  estimate: any;

  constructor(
    private estimateService: EstimateService,
  ) {}

  ngOnInit(): void {
    this.fetchEstimate(); 
  }

  fetchEstimate() {
    this.estimateService.getEstimate().subscribe((data) => {
      if (Array.isArray(data) && data.length > 0) {
        this.estimate = data[0]; // Take the first item from the array
      } else {
        this.estimate = null; // Reset estimate if data array is empty
      }
      console.log(this.estimate);
    });
  }
}
