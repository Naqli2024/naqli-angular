import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [],
  templateUrl: './booking-modal.component.html',
  styleUrl: './booking-modal.component.css'
})
export class BookingModalComponent {
  @Input() bookingId!: string;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    // Automatically close the modal and navigate after 2 seconds
    setTimeout(() => {
      this.closeModalAndNavigate();
    }, 2000); 
  }

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }
}
