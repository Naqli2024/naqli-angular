import { Component, Input } from '@angular/core';
import { BookingService } from '../../../../services/booking.service';
import { Booking } from '../../../../models/booking.model';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-show-booking-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-booking-details.component.html',
  styleUrl: './show-booking-details.component.css'
})
export class ShowBookingDetailsComponent {
  @Input() bookingId!: string
  booking!: Booking;

  constructor(
    private bookingService: BookingService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    this.bookingService.getBookingsByBookingId(this.bookingId).subscribe(
      (response) => {
        console.log(response)
        this.booking = response.data;
        console.log(this.booking)
      },
      (error) => {
        console.error('Error fetching bookings:', error);
      }
    )
  }

  closeModalAndNavigate() {
    this.activeModal.dismiss();
  }
}
