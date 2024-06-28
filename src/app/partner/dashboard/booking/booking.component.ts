import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class PartnerBookingComponent {
  constructor(private router: Router){}
  
  openPaymentConfirmation() {
    this.router.navigate(['/home/partner/dashboard/booking/confirm-payment']);
  }
}
