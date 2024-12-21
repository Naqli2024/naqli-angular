import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit, faPrint, faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.css',
})
export class InvoiceComponent {
  isInvoiceTableVisible = true;
  faEdit = faEdit;
  faPrint = faPrint;
  faDownload = faDownload;

  createInvoice() {
    this.isInvoiceTableVisible = false;
  }
}
