import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../../services/partner/partner.service';
import { BookingService } from '../../../../services/booking.service';
import { UserService } from '../../../../services/user.service';
import { forkJoin } from 'rxjs';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './booking-management.component.html',
  styleUrls: ['./booking-management.component.css'],
})

export class BookingManagementComponent {
  bookings: any[] = [];
  users: any = {}; // To store user details by userId
  partnerId: string = '';
  partner: any;
  bookingId: string = '';
  bookingRequests: string[] = [];
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  filteredOperators: any[] = [];

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
    this.partnerService.getPartnerDetails(this.partnerId).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        this.partner = response.data;
        if (this.partner && this.partner.operators) {
          this.extractBookingRequests();
          this.getBookingsByBookingId();
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch partner details');
        console.error('Error fetching partner details', error);
      }
    );
  }

  extractBookingRequests() {
    this.bookingRequests = this.partner.operators.reduce(
      (acc: any[], operator: any) => {
        if (operator.bookingRequest && operator.bookingRequest.length) {
          operator.bookingRequest.forEach((booking: any) => {
            if (booking.bookingId) {
              acc.push(booking.bookingId);
            }
          });
        }
        return acc;
      },
      []
    );
  }

  getBookingsByBookingId() {
    const bookingObservables = this.bookingRequests.map((bookingId: string) =>
      this.bookingService.getBookingsByBookingId(bookingId)
    );

    forkJoin(bookingObservables).subscribe(
      (responses: any[]) => {
        this.spinnerService.hide();
        this.bookings = responses.flatMap((response) => response.data);
        this.fetchUsers();
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch booking details');
        console.error('Error fetching bookings', error);
      }
    );
  }

  fetchUsers() {
    this.spinnerService.show();
    const userIds = this.getUniqueUserIds();

    if (userIds.length > 0) {
      const userObservables = userIds.map((userId) =>
        this.userService.getUserById(userId)
      );

      forkJoin(userObservables).subscribe(
        (users: any[]) => {
          this.spinnerService.hide();
          this.users = this.mapUsersById(users);
          this.populateDropdown(); // Call the function here
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch user details');
          console.error('Error fetching user details', error);
        }
      );
    }
  }

  getUniqueUserIds() {
    return this.bookings
      .map((booking) => booking.user)
      .filter((value, index, self) => value && self.indexOf(value) === index);
  }

  mapUsersById(users: any[]) {
    return users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});
  }

  populateDropdown() {
    const operators = this.partner.operators || [];
    const extraOperators = this.partner.extraOperators || [];

    console.log('Operators:', operators);
    console.log('Extra Operators:', extraOperators);

    const filteredOperators = this.filterOperatorsByCriteria(this.bookings, operators);
    const filteredExtraOperators = this.filterExtraOperators(extraOperators);

    this.filteredOperators = [...filteredOperators, ...filteredExtraOperators];

    console.log('Filtered Operators:', this.filteredOperators);
  }

  filterOperatorsByCriteria(bookings: any[], operators: any[]): any[] {
    return operators.filter(operator =>
      bookings.some(booking => this.matchesCriteria(booking, operator))
    );
  }

  filterExtraOperators(extraOperators: any[]): any[] {
    return extraOperators.flatMap((operator) => {
      // Check if the operator does not have unitType, unitClassification, or subClassification
      const hasNoCriteriaFields = !operator.unitType && !operator.unitClassification && !operator.subClassification;
  
      if (hasNoCriteriaFields) {
        // Check if operator is an array before mapping
        if (Array.isArray(operator)) {
          return operator.map((detail) => ({
            ...detail,
            type: 'extraOperator',
          }));
        } else {
          // If operator is not an array, return it as a single object
          return [{
            ...operator,
            type: 'extraOperator',
          }];
        }
      }
      return [];
    });
  }

  matchesCriteria(booking: any, operator: any): boolean {
    const bookingUnitType = booking.unitType?.trim() || '';
    const operatorUnitType = operator.unitType?.trim() || '';

    const bookingUnitClassification = booking.unitClassification?.trim();
    const operatorUnitClassification = operator.unitClassification?.trim();

    const unitTypeMatch = bookingUnitType === operatorUnitType;
    const unitClassificationMatch =
      !bookingUnitClassification || !operatorUnitClassification || bookingUnitClassification === operatorUnitClassification;

    const subClassificationMatch =
      !booking.subClassification || booking.subClassification === operator.subClassification;

    console.log(
      `Booking Unit Type: ${bookingUnitType}, Operator Unit Type: ${operatorUnitType}`
    );
    console.log(
      `Booking Unit Classification: ${bookingUnitClassification}, Operator Unit Classification: ${operatorUnitClassification}`
    );
    console.log(
      `Booking Sub Classification: ${booking.subClassification}, Operator Sub Classification: ${operator.subClassification}`
    );
    console.log(`Unit Type Match: ${unitTypeMatch}`);
    console.log(`Unit Classification Match: ${unitClassificationMatch}`);
    console.log(`Sub Classification Match: ${subClassificationMatch}`);

    const isMatch = unitTypeMatch && unitClassificationMatch && subClassificationMatch;
    console.log(
      `Checking match for booking ${booking._id} with operator ${operator._id}: ${isMatch}`
    );
    return isMatch;
  }
}