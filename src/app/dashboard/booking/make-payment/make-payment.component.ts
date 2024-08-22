import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PaymentSuccessfulComponent } from './payment-successful/payment-successful.component';

@Component({
  selector: 'app-make-payment',
  standalone: true,
  imports: [],
  templateUrl: './make-payment.component.html',
  styleUrl: './make-payment.component.css',
})
export class MakePaymentComponent {
  constructor(private modalService: NgbModal) {}

  paymentSuccessfulModal(event: MouseEvent): void {
    event.preventDefault();
    const modalRef = this.modalService.open(PaymentSuccessfulComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
  }
}
