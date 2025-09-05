import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../../services/partner/partner.service';
import { BookingService } from '../../../../services/booking.service';
import { UserService } from '../../../../services/user.service';
import { catchError, forkJoin, throwError } from 'rxjs';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { of, Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './booking-management.component.html',
  styleUrls: ['./booking-management.component.css'],
})
export class BookingManagementComponent implements OnInit {
  bookings: any[] = [];
  users: { [key: string]: any } = {};
  partnerId: string = '';
  partner: any;
  bookingId: string = '';
  bookingRequests: string[] = [];
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  filteredOperators: any[] = [];
  selectedPlateInformation: { [bookingId: string]: string } = {};
  selectedOperatorName: { [bookingId: string]: string } = {}; // Changed from selectedOperatorEmail to selectedOperatorName
  editingBooking: string | null = null;
  combinedDetails: any = {};
  editMode: { [key: string]: boolean } = {};
  isEdited: { [key: string]: boolean } = {};
  assignBooking = {
    bookingId: '',
    unit: '',
    operatorName: '',
  };

  constructor(
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private partnerService: PartnerService,
    private bookingService: BookingService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.partnerId = this.getPartnerId();
    this.getPartnerDetails();
  }

  getPartnerId(): string {
    return localStorage.getItem('partnerId') || '';
  }

  getPartnerDetails() {
    this.spinnerService.show();
    this.partnerService
      .getPartnerDetails(this.partnerId)
      .pipe(
        catchError((error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch partner details');
          // console.error('Error fetching partner details', error);
          return of(null);
        })
      )
      .subscribe((response: any) => {
        this.spinnerService.hide();
        this.partner = response?.data;

        if (this.partner) {
          this.bookingRequests = this.partner.bookingRequest
            .sort((a: any, b: any) => {
              // Push "not Completed" to the top
              if (
                a.bookingStatus !== 'Completed' &&
                b.bookingStatus === 'Completed'
              )
                return -1;
              if (
                a.bookingStatus === 'Completed' &&
                b.bookingStatus !== 'Completed'
              )
                return 1;
              return 0; // keep relative order if both are same
            })
            .map((booking: any) => booking.bookingId);

          this.partner.bookingRequest.forEach((booking: any) => {
            this.selectedPlateInformation[booking.bookingId] =
              booking.assignedOperator?.unit || '';
            this.selectedOperatorName[booking.bookingId] =
              booking.assignedOperator?.operatorName || ''; // Updated to operatorName
          });

          if (this.bookingRequests.length > 0) {
            this.getBookingsByBookingId();
          } else {
            this.toastr.info('No booking requests found for this partner.');
          }
        }
      });
  }

  getBookingsByBookingId() {
    const bookingObservables = this.bookingRequests.map((bookingId: string) =>
      this.bookingService.getBookingsByBookingId(bookingId).pipe(
        catchError((error) => {
          this.toastr.error(`Failed to fetch booking details for ${bookingId}`);
          // console.error('Error fetching bookings', error);
          return of(null);
        })
      )
    );

    forkJoin(bookingObservables).subscribe((responses: any[]) => {
      this.spinnerService.hide();
      this.bookings = responses.flatMap(
        (response: any) => response?.data || []
      );
      this.fetchUsers();
    });
  }

  fetchUsers() {
    this.spinnerService.show();
    const userIds = this.getUniqueUserIds();

    if (userIds.length > 0) {
      const userObservables = userIds.map((userId) =>
        this.userService.getUserById(userId).pipe(
          catchError((error) => {
            this.toastr.error(`Failed to fetch user details for ${userId}`);
            // console.error('Error fetching user details', error);
            return of(null);
          })
        )
      );

      forkJoin(userObservables).subscribe((users: any[]) => {
        this.spinnerService.hide();
        this.users = this.mapUsersById(users);
        this.populateDropdown();
      });
    }
  }

  getUniqueUserIds() {
    return this.bookings
      .map((booking) => booking.user)
      .filter((value, index, self) => value && self.indexOf(value) === index);
  }

  mapUsersById(users: any[]) {
    return users.reduce((acc, user) => {
      if (user) acc[user._id] = user;
      return acc;
    }, {} as { [key: string]: any });
  }

  populateDropdown() {
    const operators = this.partner.operators || [];
    const extraOperators = this.partner.extraOperators || [];

    const filteredOperators = this.filterOperatorsByCriteria(
      this.bookings,
      operators
    );
    // console.log('filteredOperators:', filteredOperators);
    const filteredExtraOperators = this.filterExtraOperators(extraOperators);

    this.filteredOperators = [...filteredOperators, ...filteredExtraOperators];
  }

  filterOperatorsByCriteria(bookings: any[], operators: any[]): any[] {
    return operators.filter((operator) =>
      bookings.some((booking) => this.matchesCriteria(booking, operator))
    );
  }

  filterExtraOperators(extraOperators: any[]): any[] {
    return extraOperators.filter((operator) => true); // Include all extra operators regardless of criteria
  }

  matchesCriteria(booking: any, operator: any): boolean {
    const bookingUnitType = booking.unitType?.trim() || '';
    const operatorUnitType = operator.unitType?.trim() || '';

    const bookingUnitClassification = booking.unitClassification?.trim();
    const operatorUnitClassification = operator.unitClassification?.trim();

    // Special case: shared-cargo booking can match bus operator
    if (bookingUnitType === 'shared-cargo' && operatorUnitType === 'bus') {
      return true;
    }

    const unitTypeMatch = bookingUnitType === operatorUnitType;
    const unitClassificationMatch =
      !bookingUnitClassification ||
      !operatorUnitClassification ||
      bookingUnitClassification === operatorUnitClassification;

    const subClassificationMatch =
      !booking.subClassification ||
      booking.subClassification === operator.subClassification;

    return unitTypeMatch && unitClassificationMatch && subClassificationMatch;
  }

  getFilteredOperators(bookingId: string): any[] {
    const selectedPlate = this.selectedPlateInformation[bookingId];
    if (!selectedPlate) {
      return [];
    }

    // Filter main operators based on plate information
    const mainOperators = this.filteredOperators.filter(
      (operator) => operator.plateInformation === selectedPlate
    );

    // Include extra operators if plate information is selected
    const extraOperators =
      this.partner.extraOperators?.map((operator) => ({
        ...operator,
        type: 'extraOperator',
        // label: ' (Extra Driver)',
      })) || [];

    return [...(mainOperators || []), ...(extraOperators || [])];
  }

  onPlateInfoChange(bookingId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const plateInformation = target.value;
    this.selectedPlateInformation[bookingId] = plateInformation;
    this.selectedOperatorName[bookingId] = ''; // Reset operatorName when plate information changes

    // Update the assignBooking.unit with the new plate information
    this.assignBooking.unit = plateInformation;
    this.assignBooking.bookingId = bookingId;
  }

  onOperatorChange(bookingId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const operatorName = target.value;

    // Update the selected operator
    this.selectedOperatorName[bookingId] = operatorName;

    // Update the assignBooking.operatorName with the selected operator name
    this.assignBooking.operatorName = operatorName;
    this.assignBooking.bookingId = bookingId;
  }

  assignOperators() {
    this.spinnerService.show();

    // Assuming assignBooking is already populated with bookingId, unit, and operatorName
    if (
      this.assignBooking.bookingId &&
      this.assignBooking.unit &&
      this.assignBooking.operatorName
    ) {
      // Directly send assignBooking data to the API
      this.partnerService
        .assignOperator(
          this.assignBooking.bookingId,
          this.assignBooking.unit,
          this.assignBooking.operatorName
        )
        .subscribe(
          () => {
            this.spinnerService.hide();
            this.toastr.success('Operator assigned successfully');
            this.getPartnerDetails(); // Refresh partner details after successful assignment
          },
          (error) => {
            this.spinnerService.hide();
            const errorMessage =
              error.error?.message || 'Failed to assign operator';
            this.toastr.error(errorMessage);
          }
        );
    } else {
      this.spinnerService.hide();
      this.toastr.error(
        'Missing required fields: bookingId, unit, or operatorName'
      );
    }
  }

  trackByOperatorEmail(index: number, operator: any): string {
    return operator.email || operator._id;
  }

  editBooking(bookingId: string) {
    this.editMode[bookingId] = true;
    this.isEdited[bookingId] = true;
  }
}
