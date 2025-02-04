import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, QRCodeModule,],
  templateUrl: './invoice-modal.component.html',
  styleUrl: './invoice-modal.component.css',
})
export class InvoiceModalComponent implements OnInit {
  qrCodeData: any = null;
  isModalOpen: boolean = false;

  constructor(private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Parse query parameters from the URL
    this.route.queryParams.subscribe((params) => {
      if (params['InvoiceId']) {
        // Populate the QR code data
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
        };

        this.isModalOpen = true;
        this.cd.detectChanges();
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
