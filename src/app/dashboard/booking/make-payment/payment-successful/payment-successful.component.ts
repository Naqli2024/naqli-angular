import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-payment-successful',
  standalone: true,
  imports: [],
  templateUrl: './payment-successful.component.html',
  styleUrl: './payment-successful.component.css'
})
export class PaymentSuccessfulComponent {
  constructor(public activeModal: NgbActiveModal, public router: Router) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
    this.router.navigate(['/home/user/dashboard/booking-history']);
  }
}
