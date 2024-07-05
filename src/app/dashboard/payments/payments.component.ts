import { Component } from '@angular/core';
import { Booking } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../../services/spinner.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent {
  bookings: Booking[] = [];

  constructor(
    private bookingService: BookingService,
    private toastr: ToastrService, 
    private authService: AuthService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();
  }

  fetchCompletedBookings() {
    this.spinnerService.show();
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getCompletedBookingsByUser(userId).subscribe(
        (response) => {
          if (response.success) {
            this.spinnerService.hide();
            this.bookings = response.data;
            console.log(this.bookings)
          } else {
            this.spinnerService.hide();
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
          console.error('Error fetching bookings:', error);
        }
      );
    } else {
      this.toastr.error('User ID not available');
    }
  }
}
