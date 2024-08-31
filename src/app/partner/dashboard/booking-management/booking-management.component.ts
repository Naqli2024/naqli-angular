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
  users: { [key: string]: any } = {};
  partnerId: string = '';
  partner: any;
  bookingId: string = '';
  bookingRequests: string[] = [];
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  filteredOperators: any[] = [];
  selectedPlateInformation: { [bookingId: string]: string } = {};
  selectedOperatorEmail: string = ''; 

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

        if (this.partner) {
          this.bookingRequests = this.partner.operators.reduce((acc: string[], operator: any) => {
            if (operator.operatorsDetail && operator.operatorsDetail.length) {
              operator.operatorsDetail.forEach((operatorDetail: any) => {
                if (operatorDetail.bookingRequest && operatorDetail.bookingRequest.length) {
                  operatorDetail.bookingRequest.forEach((booking: any) => {
                    if (booking.bookingId) {
                      acc.push(booking.bookingId);
                    }
                  });
                }
              });
            }
            return acc;
          }, []);

          if (!this.bookingRequests.length && this.partner.bookingRequest) {
            this.partner.bookingRequest.forEach((booking: any) => {
              if (booking.bookingId) {
                this.bookingRequests.push(booking.bookingId);
              }
            });
          }

          if (this.bookingRequests.length > 0) {
            this.getBookingsByBookingId();
          } else {
            this.toastr.info('No booking requests found for this partner.');
          }
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch partner details');
        console.error('Error fetching partner details', error);
      }
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
          this.populateDropdown();
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
    }, {} as { [key: string]: any });
  }

  populateDropdown() {
    const operators = this.partner.operators || [];
    const extraOperators = this.partner.extraOperators || [];

    const filteredOperators = this.filterOperatorsByCriteria(this.bookings, operators);
    const filteredExtraOperators = this.filterExtraOperators(extraOperators);

    this.filteredOperators = [...filteredOperators, ...filteredExtraOperators];
  }

  filterOperatorsByCriteria(bookings: any[], operators: any[]): any[] {
    return operators.filter(operator =>
      bookings.some(booking => this.matchesCriteria(booking, operator))
    );
  }

  filterExtraOperators(extraOperators: any[]): any[] {
    return extraOperators.filter(operator => true); // Include all extra operators regardless of criteria
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

    return unitTypeMatch && unitClassificationMatch && subClassificationMatch;
  }

  getFilteredOperators(bookingId: string) {
    const selectedPlate = this.selectedPlateInformation[bookingId];
    
    // Filter main operators based on plateInformation
    const mainOperators = this.filteredOperators.filter(operator =>
      operator.plateInformation === selectedPlate
    );
  
    // Filter extra operators based on plateInformation
    const extraOperators = selectedPlate ? this.partner.extraOperators.map(operator => ({
      ...operator,
      type: 'extraOperator',
      label: ' (Extra Driver)'
    })) : [];
  
    // Combine main operators and extra operators
    return [...mainOperators, ...extraOperators];
  }

  onPlateInfoChange(bookingId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const plateInformation = target.value;
    this.selectedPlateInformation[bookingId] = plateInformation;
  }
}