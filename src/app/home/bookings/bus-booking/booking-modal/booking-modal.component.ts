import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [],
  templateUrl: './booking-modal.component.html',
  styleUrl: './booking-modal.component.css',
})
export class BookingModalComponent {
  @Input() bookingId!: string;

  constructor(public activeModal: NgbActiveModal, public router: Router) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
    this.router.navigate(['/home/user/dashboard'],{ queryParams: { bookingId: this.bookingId } });
  }
}
