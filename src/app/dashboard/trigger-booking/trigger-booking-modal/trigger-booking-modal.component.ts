import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-trigger-booking-modal',
  standalone: true,
  imports: [],
  templateUrl: './trigger-booking-modal.component.html',
  styleUrl: './trigger-booking-modal.component.css'
})
export class TriggerBookingModalComponent {
  constructor(public activeModal: NgbActiveModal, public router: Router) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }
}