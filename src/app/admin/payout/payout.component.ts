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

  ngOnInit() {
    this.spinnerService.show();

    this.bookingService
      .getAllBookings()
      .pipe(
        switchMap((bookings) => {
          this.bookings = bookings;
          
          if (!bookings.length) {
            this.spinnerService.hide(); 
            return of([]); 
          }

          const userRequests = bookings.map((booking) =>
            this.userService.getUserById(booking.user).pipe(
              catchError(() => of(undefined)) 
            )
          );

          const partnerRequests = bookings.map((booking) =>
            booking.partner
              ? this.partnerService.getPartnerDetails(booking.partner).pipe(
                  catchError(() => of(undefined)) 
                )
              : of(undefined)
          );

          return forkJoin([...userRequests, ...partnerRequests]);
        }),
        finalize(() => this.spinnerService.hide()) 
      )
      .subscribe(
        (results) => {
          const userResults = results.slice(0, this.bookings.length) as (any | undefined)[];
          const partnerResults = results.slice(this.bookings.length) as ({ success: boolean; data: any } | undefined)[];

          userResults.forEach((user, index) => {
            if (user) this.users[this.bookings[index].user] = user;
          });

          partnerResults.forEach((partnerResponse, index) => {
            if (partnerResponse && partnerResponse.success) {
              this.partners[this.bookings[index].partner] = partnerResponse.data;
            }
          });

          this.filteredBookings = this.bookings; // Load all bookings initially
        },
        (error) => {
          console.error('Error fetching bookings:', error);
          this.toastr.error('Failed to load booking details', 'Error');
        }
      );

    // Set default to 'All' tab to show all bookings
    this.selectTimeRange('all');
  }

  selectTab(tab: string) {
    this.isInitialPayoutTab = tab === 'initialPayout';
  }

  selectTimeRange(range: string) {
    if (range === 'hourly') {
      this.isHourlyTab = true;
      this.isWeeklyTab = false;
      this.isAllTab = false;
      this.filterBookingsByTime('hourly');
    } else if (range === 'weekly') {
      this.isWeeklyTab = true;
      this.isHourlyTab = false;
      this.isAllTab = false;
      this.filterBookingsByTime('weekly');
    } else if (range === 'daily') {
      this.isDailyTab = true;
      this.isHourlyTab = false;
      this.isWeeklyTab = false;
      this.isAllTab = false;
      this.filterBookingsByTime('daily');
    } else if (range === 'all') {
      this.isAllTab = true;
      this.isHourlyTab = false;
      this.isWeeklyTab = false;
      this.showAllBookings(); // Show all bookings
    }
  }

  filterBookingsByTime(range: string) {
    const now = new Date();
    let startOfDay: Date;

    if (range === 'hourly') {
      startOfDay = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    } else if (range === 'weekly') {
      startOfDay = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    } else if (range === 'daily') {
      startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Start of today
    }

    // Filter bookings based on the createdAt timestamp
    this.filteredBookings = this.bookings.filter((booking) => {
      const createdAt = new Date(booking.createdAt).getTime();
      return createdAt >= startOfDay.getTime();
    });
  }

  showAllBookings() {
    // Show all bookings without filtering
    this.filteredBookings = this.bookings;
  }

  toggleSelectAll() {
    // Toggle all checkboxes based on the header checkbox
    this.filteredBookings.forEach((booking) => {
      booking.selected = this.selectAll;
    });
  }

  generatePDFOrExcel() {
    const selectedBookings = this.filteredBookings.filter((booking) => booking.selected);

    if (selectedBookings.length > 0) {
      if (this.isInitialPayoutTab) {
        this.generateExcelForInitialPayout(selectedBookings);
      } else {
        this.generateExcel(selectedBookings);
      }
    } else {
      alert('Please select at least one item.');
    }
  }

  generateExcel(selectedBookings: any[]) {
    const filteredData = selectedBookings.map(booking => {
      const user = this.users[booking.user] || {};
      const partner = this.partners[booking.partner] || {};
  
      return {
        "Booking ID": booking._id || "N/A",
        "User Name": booking.name || "N/A",
        "Pickup Location": booking.pickup || "N/A",
        "Drop Points": Array.isArray(booking.dropPoints) ? booking.dropPoints.join(", ") : booking.dropPoints || "N/A",
        "Final Payout (SAR)": booking.finalPayout || 0,
        "Partner Name": partner.partnerName || "N/A",
        "Region": partner.region || "N/A",
        "City": partner.city || "N/A",
        "Bank Name": partner.bank || "N/A",
        "IBAN": partner.ibanNumber || "N/A"
      };
    });
  
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Bookings");
  
    // Download the Excel file
    XLSX.writeFile(wb, "selected-bookings.xlsx");
  }

  generateExcelForInitialPayout(selectedBookings: any[]) {
    const filteredData = selectedBookings.map(booking => {
      const user = this.users[booking.user] || {};
      const partner = this.partners[booking.partner] || {};
  
      return {
        "Booking ID": booking._id || "N/A",
        "User": `${user.firstName || "N/A"} ${user.lastName || ""}`,
        "Date": booking.date || "N/A",
        "Initial Payout (SAR)": booking.initialPayout || 0,
        "Partner Name": partner.partnerName || "N/A",
        "Region": partner.region || "N/A",
        "City": partner.city || "N/A",
        "Bank Name": partner.bank || "N/A",
        "Company": partner.company || 'N/A',
        "IBAN": partner.ibanNumber || "N/A"
      };
    });
  
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Bookings");
  
    // Download the Excel file
    XLSX.writeFile(wb, "selected-bookings.xlsx");
  }
}