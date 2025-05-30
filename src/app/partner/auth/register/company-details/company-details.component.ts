import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CompanyDetailsService } from '../../../../../services/partner/companyDetails.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../services/spinner.service';
import { PartnerService } from '../../../../../services/partner/partner.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './company-details.component.html',
  styleUrl: './company-details.component.css',
})

export class CompanyDetailsComponent {
  faEdit = faEdit;
  faTimes = faTimes;
  faCheck = faCheck;
  isEditing: boolean = false;

  companyDetails: any = {
    companyName: '',
    legalName: '',
    phoneNumber: '',
    alternativePhoneNumber: '',
    address: '',
    city: '',
    zipCode: '',
    companyType: '',
    companyIdNo: '',
    partnerId: '',
    partnerName: '',
  };

  constructor(
    private companyDetailsService: CompanyDetailsService,
    private router: Router,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    const partnerId = localStorage.getItem('partnerId');
    if (partnerId) {
      this.spinnerService.show();
      this.partnerService.getPartnerDetails(partnerId).subscribe({
        next: (partnerDetails) => {
          this.companyDetails.partnerId = partnerId;
          this.companyDetails.partnerName =
            partnerDetails.data.partnerName || '';
          this.spinnerService.hide();
        },
        error: (error) => {
          this.spinnerService.hide();
          this.toastr.error('Error fetching partner details');
        },
      });
    } else {
      this.toastr.error('Partner ID not found.');
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  onSubmit() {
    const partnerId = localStorage.getItem('partnerId');
    if (!partnerId) {
      this.toastr.error('Partner ID not found.');
      return;
    }

    // Define required fields and their corresponding messages
    const requiredFields: { [key: string]: string } = {
      companyName: 'Company Name is required.',
      legalName: 'Legal Name is required.',
      phoneNumber: 'Phone Number is required.',
      address: 'Address is required.',
      city: 'City is required.',
      zipCode: 'Zipcode is required.',
      companyType: 'Company Type is required.',
      companyIdNo: 'Company Id No is required.',
    };

    // Define numeric fields and their corresponding error messages
    const numericFields: { [key: string]: string } = {
      phoneNumber: 'Phone Number must be numeric.',
      alternativePhoneNumber: 'Alternative Phone Number must be numeric.',
      zipCode: 'Zipcode must be numeric.',
      companyIdNo: 'Company Id No must be numeric.',
    };

    // Check if any required fields are missing
    for (const [key, message] of Object.entries(requiredFields)) {
      if (!this.companyDetails[key]) {
        this.toastr.error(message);
        return;
      }
    }

    // Check if numeric fields contain only digits
    for (const [key, message] of Object.entries(numericFields)) {
      if (this.companyDetails[key] && !/^\d+$/.test(this.companyDetails[key])) {
        this.toastr.error(message);
        return;
      }
    }

    this.spinnerService.show();

    this.companyDetailsService
      .addCompanyDetails(partnerId, this.companyDetails)
      .subscribe({
        next: (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message);
          this.router.navigate(['/home/partner/login']);
          this.resetForm();
        },
        error: (error) => {
          this.spinnerService.hide();
          let errorMessage = 'An error occurred';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.toastr.error(errorMessage);
        },
      });
  }

  resetForm() {
    this.companyDetails = {
      companyName: '',
      legalName: '',
      phoneNumber: '',
      alternativePhoneNumber: '',
      address: '',
      city: '',
      zipCode: '',
      companyType: '',
      companyIdNo: '',
      partnerId: '',
      partnerName: '',
    };
  }
}