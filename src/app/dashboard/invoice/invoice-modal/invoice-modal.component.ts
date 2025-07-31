import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { BookingService } from '../../../../services/booking.service';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, QRCodeModule],
  templateUrl: './invoice-modal.component.html',
  styleUrl: './invoice-modal.component.css',
})
export class InvoiceModalComponent implements OnInit {
  qrCodeData: any = null;
  isModalOpen: boolean = false;
  booking: any = null;

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['InvoiceId']) {
        this.isModalOpen = true;

        if (params['bookingId']) {
          this.bookingService
            .getBookingsByBookingId(params['bookingId'])
            .subscribe(
              (response) => {
                this.booking = response.data;

                const description = [
                  this.booking?.pickup,
                  ...(this.booking?.dropPoints || []),
                ]
                  .filter(Boolean)
                  .join(', ');

                this.qrCodeData = {
                  InvoiceId: params['InvoiceId'],
                  InvoiceDate: params['InvoiceDate'],
                  CustomerName: params['CustomerName'],
                  PaymentAmount: params['PaymentAmount'],
                  Address: params['Address'],
                  bookingId: params['bookingId'],
                  unitType: params['unitType'],
                  partnerName: params['partnerName'],
                  paymentType: params['paymentType'],
                  description: description, 
                };

                this.cd.detectChanges();
              },
              (error) => {
                console.error('Failed to fetch booking details:', error);
              }
            );
        } else {
          this.qrCodeData = {
            InvoiceId: params['InvoiceId'],
            InvoiceDate: params['InvoiceDate'],
            CustomerName: params['CustomerName'],
            PaymentAmount: params['PaymentAmount'],
            Address: params['Address'],
            bookingId: '',
            unitType: params['unitType'],
            partnerName: params['partnerName'],
            paymentType: params['paymentType'],
            description: '',
          };
          this.cd.detectChanges();
        }
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
