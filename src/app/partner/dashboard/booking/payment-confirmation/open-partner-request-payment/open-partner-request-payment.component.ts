import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-open-partner-request-payment',
  standalone: true,
  imports: [],
  templateUrl: './open-partner-request-payment.component.html',
  styleUrl: './open-partner-request-payment.component.css'
})
export class OpenPartnerRequestPaymentComponent {
  @Input() bookingId!: string;

  constructor(public activeModal: NgbActiveModal) {}

}
