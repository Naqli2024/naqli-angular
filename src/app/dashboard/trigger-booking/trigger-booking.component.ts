import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TriggerBookingModalComponent } from './trigger-booking-modal/trigger-booking-modal.component';

@Component({
  selector: 'app-trigger-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trigger-booking.component.html',
  styleUrl: './trigger-booking.component.css',
})
export class TriggerBookingComponent {

  
  constructor(
    private modalService: NgbModal,
  ) {}

  vendors = [
    {
      name: 'Ajith',
      price: 250,
    },
    {
      name: 'John',
      price: 360,
    },
    {
      name: 'Saravanan',
      price: 360,
    },
  ];

  openPaymentModal(): void {
    const modalRef = this.modalService.open(TriggerBookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
  }
}
