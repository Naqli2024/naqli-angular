import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentNotificationService {
  private paymentStatusSubject = new Subject<void>(); // Subject to notify components
  paymentStatus$ = this.paymentStatusSubject.asObservable();

  // Call this method when the payment is successful
  notifyPaymentSuccess() {
    this.paymentStatusSubject.next(); // Notify any subscribers
  }
}