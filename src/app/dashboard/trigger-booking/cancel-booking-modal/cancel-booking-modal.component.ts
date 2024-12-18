import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { BookingService } from '../../../../services/booking.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cancel-booking-modal',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './cancel-booking-modal.component.html',
  styleUrl: './cancel-booking-modal.component.css',
})
export class CancelBookingModalComponent {
  @Input() bookingId: any;
  @Input() fetchBookings?: () => void;

  constructor(
    public activeModal: NgbActiveModal,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private bookingService: BookingService
  ) {}

  cancelBooking(): void {
    this.spinnerService.show();

    this.bookingService.cancelBooking(this.bookingId).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        this.closeModalAndNavigate();
        this.toastr.success(response.message);
        if (this.fetchBookings && this.bookingId) {
          this.fetchBookings();
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error(
          error.error?.message || 'Failed to cancel booking',
          'Error'
        );
      }
    );
  }

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }
}
