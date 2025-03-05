import { Component } from '@angular/core';
import { PartnerService } from '../../../services/partner/partner.service';
import { Partner } from '../../../models/partnerData.model';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../../services/spinner.service';

@Component({
  selector: 'app-partner-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './partner-admin.component.html',
  styleUrl: './partner-admin.component.css',
})
export class PartnerAdminComponent {
  partners: Partner[] = [];
  options: string[] = [
    'MoreOptions',
    'BlockPartner',
    'SuspendPartner',
    'ReactivatePartner',
  ];
  isAllSelected: boolean = false; // Track the "Select All" checkbox state

  constructor(
    private partnerService: PartnerService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.spinnerService.show();

    this.partnerService
      .getAllPartners()
      .pipe(finalize(() => this.spinnerService.hide()))
      .subscribe(
        (response: any) => {
          if (response && response.data) {
            this.partners = response.data;
            this.updateSelectAllState();
          } else {
            this.toastr.error('Invalid response format from backend', 'Error');
          }
        },
        (error) => {
          this.toastr.error('Error fetching partner details', 'Error');
        }
      );
  }

  onActionSelected(event: any): void {
    const action = (event.target as HTMLSelectElement).value;
    const selectedPartners = this.partners.filter(
      (partner) => partner.selected
    );

    if (selectedPartners.length === 0) {
      this.toastr.error('Please select at least one partner.');
      return;
    }

    switch (action) {
      case 'Block Partner':
        this.updatePartnerStatus(selectedPartners, { isBlocked: true });
        break;
      case 'Suspend Partner':
        this.updatePartnerStatus(selectedPartners, { isSuspended: true });
        break;
      case 'Reactivate Partner':
        this.updatePartnerStatus(selectedPartners, {
          isBlocked: false,
          isSuspended: false,
        });
        break;
      default:
        break;
    }
  }

  updatePartnerStatus(partners: Partner[], status: any): void {
    const updateRequests = partners.map((partner) =>
      this.partnerService.updatePartnerStatus(partner._id, status).toPromise()
    );
    Promise.all(updateRequests).then(
      () => {
        this.toastr.success('Partner status updated successfully.');
        this.loadPartners(); // Refresh partner list
      },
      (error) => {
        this.toastr.error('Error updating partner status.');
        // console.error(error);
      }
    );
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.partners.forEach((partner) => (partner.selected = isChecked));
    this.isAllSelected = isChecked;
  }

  updateSelectAllState(): void {
    this.isAllSelected =
      this.partners.length > 0 &&
      this.partners.every((partner) => partner.selected);
  }
}
