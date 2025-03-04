import { Component, Input } from '@angular/core';
import { BookingService } from '../../../../services/booking.service';
import { Booking } from '../../../../models/booking.model';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-show-booking-details',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './show-booking-details.component.html',
  styleUrl: './show-booking-details.component.css'
})
export class ShowBookingDetailsComponent {
  @Input() bookingId!: string
  booking!: Booking;

  constructor(
    private bookingService: BookingService,
    public activeModal: NgbActiveModal,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.bookingService.getBookingsByBookingId(this.bookingId).subscribe(
      (response) => {
        // console.log(response)
        this.booking = response.data;
        // console.log(this.booking)
      },
      (error) => {
        // console.error('Error fetching bookings:', error);
      }
    )
  }

  closeModalAndNavigate() {
    this.activeModal.dismiss();
  }

  getTranslatedName(name: string): string {
    const categories = ['vehicleName', 'busNames', 'equipmentName', 'specialUnits'];
    for (let category of categories) {
      const translationKey = `${category}.${name}`;
      if (this.translate.instant(translationKey) !== translationKey) {
        return this.translate.instant(translationKey);
      }
    }
    return name; 
  }
}
