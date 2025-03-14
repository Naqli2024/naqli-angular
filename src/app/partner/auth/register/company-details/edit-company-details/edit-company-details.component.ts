import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { PartnerService } from '../../../../../../services/partner/partner.service';
import { CompanyDetailsService } from '../../../../../../services/partner/companyDetails.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-edit-company-details',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, FontAwesomeModule],
  templateUrl: './edit-company-details.component.html',
  styleUrl: './edit-company-details.component.css',
})
export class EditCompanyDetailsComponent {
  formData: any = {};

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private partnerService: PartnerService,
    private companyDetailsService: CompanyDetailsService
  ) {}

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          const companyData = partnerDetails.data.companyDetails[0];
          this.formData = { ...companyData }; // Assign directly
        },
        (error) => {
          console.error('Error fetching partner details:', error);
          this.toastr.error('Failed to load company details.');
        }
      );
    }
  }

  saveProfile() {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (!partnerId) {
      this.toastr.error('Partner ID not found.');
      return;
    }

    // Convert formData to JSON object
    const companyDetails = { ...this.formData };

    this.companyDetailsService
      .editCompanyDetails(partnerId, companyDetails)
      .subscribe(
        (response) => {
          this.toastr.success(response.message);
        },
        (error) => {
          this.toastr.error('Error updating company details');
        }
      );
  }

  goToEditProfile() {
    this.router.navigate(['home/partner/dashboard/edit-profile/partner'])
  }
}
