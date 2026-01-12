import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Booking } from '../../../models/booking.model';
import { User } from '../../../models/user.model';
import { Partner } from '../../../models/partnerData.model';
import { BookingService } from '../../../services/booking.service';
import { UserService } from '../../../services/user.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionInputComponent } from './transaction-input/transaction-input.component';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { SpinnerService } from '../../../services/spinner.service';

@Component({
  selector: 'app-payout',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './payout.component.html',
  styleUrl: './payout.component.css',
})
export class PayoutComponent implements OnInit {
  isInitialPayoutTab: boolean = true;
  isHourlyTab: boolean = false; // To track which tab is selected
  isWeeklyTab: boolean = false; // To track weekly tab selection
  isAllTab: boolean = true; // Set All tab as default
  isDailyTab: boolean = false;
  isHistoryTab = false;
  bookings: any[] = [];
  filteredBookings: any[] = []; // To store filtered bookings
  users: { [key: string]: any } = {};
  partners: { [key: string]: any } = {};
  selectAll: boolean = false;

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  /* ---------------- INIT ---------------- */

  ngOnInit() {
    this.spinnerService.show();

    this.bookingService
      .getAllBookings()
      .pipe(
        switchMap((bookings: any[]) => {
          this.bookings = bookings || [];

          if (!this.bookings.length) {
            return of([]);
          }

          const userRequests = this.bookings.map((b) =>
            this.userService
              .getUserById(b.user)
              .pipe(catchError(() => of(null)))
          );

          const partnerRequests = this.bookings.map((b) =>
            b.partner
              ? this.partnerService
                  .getPartnerDetails(b.partner)
                  .pipe(catchError(() => of(null)))
              : of(null)
          );

          return forkJoin([...userRequests, ...partnerRequests]);
        }),
        finalize(() => this.spinnerService.hide())
      )
      .subscribe((results: any[]) => {
        const users = results.slice(0, this.bookings.length);
        const partners = results.slice(this.bookings.length);

        users.forEach((u, i) => {
          if (u) this.users[this.bookings[i].user] = u;
        });

        partners.forEach((p, i) => {
          if (p?.success) this.partners[this.bookings[i].partner] = p.data;
        });

        // Init flags
        this.bookings.forEach((b) => {
          b.selectedInitial = false;
          b.selectedFinal = false;

          b.initialPayoutDownloaded ??= false;
          b.finalPayoutDownloaded ??= false;
        });

        this.selectTimeRange('all');
      });
  }

  /* ---------------- TAB HANDLERS ---------------- */

  selectTab(tab: 'initialPayout' | 'finalPayout') {
    this.isInitialPayoutTab = tab === 'initialPayout';
    this.selectAll = false;
    this.applyFilters();
  }

  selectTimeRange(range: string) {
    this.isAllTab = range === 'all';
    this.isHourlyTab = range === 'hourly';
    this.isDailyTab = range === 'daily';
    this.isWeeklyTab = range === 'weekly';
    this.isHistoryTab = range === 'history';

    this.selectAll = false;
    this.applyFilters();
  }

  /* ---------------- FILTERS ---------------- */

  applyFilters() {
    if (this.isHistoryTab) {
      this.applyHistoryFilter();
    } else if (this.isAllTab) {
      this.applyAllFilter();
    } else {
      this.applyTimeFilter();
    }
  }

  applyAllFilter() {
    this.filteredBookings = this.bookings.filter((b) =>
      this.isInitialPayoutTab
        ? !b.initialPayoutDownloaded
        : !b.finalPayoutDownloaded
    );
  }

  applyTimeFilter() {
    const now = new Date();
    let start: Date;

    if (this.isHourlyTab) {
      start = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (this.isDailyTab) {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    this.filteredBookings = this.bookings.filter((b) => {
      const createdAt = new Date(b.createdAt).getTime();
      const notDownloaded = this.isInitialPayoutTab
        ? !b.initialPayoutDownloaded
        : !b.finalPayoutDownloaded;

      return createdAt >= start.getTime() && notDownloaded;
    });
  }

  applyHistoryFilter() {
    this.filteredBookings = this.bookings.filter((b) =>
      this.isInitialPayoutTab
        ? b.initialPayoutDownloaded
        : b.finalPayoutDownloaded
    );
  }

  /* ---------------- SELECTION ---------------- */

  toggleSelectAll() {
    this.filteredBookings.forEach((b) => {
      if (this.isInitialPayoutTab) {
        b.selectedInitial = this.selectAll;
      } else {
        b.selectedFinal = this.selectAll;
      }
    });
  }

  /* ---------------- DOWNLOAD & PAYOUT ---------------- */

  generatePDFOrExcel() {
    const selected = this.filteredBookings.filter((b) =>
      this.isInitialPayoutTab ? b.selectedInitial : b.selectedFinal
    );

    if (!selected.length) {
      this.toastr.warning('Please select at least one booking');
      return;
    }

    if (this.isInitialPayoutTab) {
      this.generateInitialPayoutCSV(selected);
    } else {
      this.generateFinalPayoutCSV(selected);
    }

    this.processPayout(selected);
  }

  processPayout(bookings: any[]) {
    const bookingIds = bookings.map((b) => b._id);
    const payoutType = this.isInitialPayoutTab ? 'initial' : 'final';

    this.bookingService
      .markPayoutDownloaded({ bookingIds, payoutType })
      .subscribe(() => {
        console.log('API SUCCESS');
        bookings.forEach((b) => {
          if (payoutType === 'initial') {
            b.initialPayoutDownloaded = true;
            b.initialPayoutDownloadedAt = new Date();
            b.selectedInitial = false;
          } else {
            b.finalPayoutDownloaded = true;
            b.finalPayoutDownloadedAt = new Date();
            b.selectedFinal = false;
          }
        });

        this.applyFilters();
      });
  }

  /* ---------------- FILE GENERATION (STRICT CSV – NO BOM) ---------------- */

  generateInitialPayoutCSV(selectedBookings: any[]) {
    const filteredData = selectedBookings.map((booking) => {
      const partner = this.partners[booking.partner] || {};

      return {
        Bank: partner.bank || 'N/A',
        'Account Number': partner.ibanNumber || 'N/A',
        Amount: booking.initialPayout || 0,
        Comments: 'Initial payment',
        'Beneficiary Name': partner.partnerName || 'N/A',
        'CR/ID Number': partner.CRNumber || 'N/A',
        'Beneficiary Address': `${partner.region || 'N/A'}, ${
          partner.city || 'N/A'
        }`,
      };
    });

    const ws = XLSX.utils.json_to_sheet(filteredData);

    const csv = XLSX.utils.sheet_to_csv(ws, {
      FS: ',',
      RS: '\r\n',
    });

    const blob = new Blob([csv], { type: 'text/csv;' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'initial-payout.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  generateFinalPayoutCSV(selectedBookings: any[]) {
    const filteredData = selectedBookings.map((booking) => {
      const partner = this.partners[booking.partner] || {};

      return {
        Bank: partner.bank || 'N/A',
        'Account Number': partner.ibanNumber || 'N/A',
        Amount: booking.finalPayout || 0,
        Comments: 'Final payment',
        'Beneficiary Name': partner.partnerName || 'N/A',
        'CR/ID Number': partner.CRNumber || 'N/A',
        'Beneficiary Address': `${partner.region || 'N/A'}, ${
          partner.city || 'N/A'
        }`,
      };
    });

    const ws = XLSX.utils.json_to_sheet(filteredData);

    const csv = XLSX.utils.sheet_to_csv(ws, {
      FS: ',',
      RS: '\r\n',
    });

    const blob = new Blob([csv], { type: 'text/csv;' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'final-payout.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
