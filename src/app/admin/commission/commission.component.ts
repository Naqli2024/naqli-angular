import { Component, OnInit } from '@angular/core';
import { CommissionService } from '../../../services/admin/commission.service';
import { ToastrService } from 'ngx-toastr';
import { faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { formatDateToInput } from '../../../helper/date-helper';
import { SpinnerService } from '../../../services/spinner.service';

@Component({
  selector: 'app-commission',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './commission.component.html',
  styleUrl: './commission.component.css',
})

export class CommissionComponent implements OnInit {
  activeTab: string = 'singleUser';
  isSingleUserEditing: boolean = false;
  isSuperUserEditing: boolean = false;
  isEnterpriseUserEditing: boolean = false;

  singleUserSlabs = [{ start: '', end: '', commission: '', isNew: false }];
  superUserSlabs = [{ start: '', end: '', commission: '', isNew: false }];
  enterpriseUserSlabs = [{ start: '', end: '', commission: '', isNew: false }];

  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  faPlus = faPlus;

  constructor(
    private commissionService: CommissionService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.fetchCommissions();
  }

  fetchCommissions() {
    this.spinnerService.show();
    this.commissionService.getCommissions().subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.processCommissionData(response.commissions);
      },
      error: (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'Failed to load commission data';
        this.toastr.error(errorMessage);
      }
    });
  }

  processCommissionData(commissions: any[]) {
    commissions.forEach(commission => {
      const slabData = commission.slabRates.map(slab => ({
        id: slab._id, // Ensure ID is included here
        start: slab.slabRateStart,
        end: slab.slabRateEnd,
        commission: slab.commissionRate.replace('%', ''),
        isNew: false
      }));
  
      if (commission.userType === 'Single User') {
        this.singleUserSlabs = slabData;
      } else if (commission.userType === 'Super User') {
        this.superUserSlabs = slabData;
      } else if (commission.userType === 'Enterprise User') {
        this.enterpriseUserSlabs = slabData;
      }
    });
  }

  addSingleUserSlab() {
    this.singleUserSlabs.push({ start: '', end: '', commission: '', isNew: true });
  }

  addSuperUserSlab() {
    this.superUserSlabs.push({ start: '', end: '', commission: '', isNew: true });
  }

  addEnterpriseUserSlab() {
    this.enterpriseUserSlabs.push({ start: '', end: '', commission: '', isNew: true });
  }

  saveNewSingleUserSlab(index: number) {
    const newSlab = this.singleUserSlabs[index];
    const payload = {
      userType: 'Single User',
      slabRates: [
        {
          slabRateStart: newSlab.start,
          slabRateEnd: newSlab.end,
          commissionRate: `${newSlab.commission}%`
        }
      ]
    };
    this.createCommission(payload, 'singleUser', index);
  }

  saveNewSuperUserSlab(index: number) {
    const newSlab = this.superUserSlabs[index];
    const payload = {
      userType: 'Super User',
      slabRates: [
        {
          slabRateStart: newSlab.start,
          slabRateEnd: newSlab.end,
          commissionRate: `${newSlab.commission}%`
        }
      ]
    };
    this.createCommission(payload, 'superUser', index);
  }

  saveNewEnterpriseUserSlab(index: number) {
    const newSlab = this.enterpriseUserSlabs[index];
    const payload = {
      userType: 'Enterprise User',
      slabRates: [
        {
          slabRateStart: newSlab.start,
          slabRateEnd: newSlab.end,
          commissionRate: `${newSlab.commission}%`
        }
      ]
    };
    this.createCommission(payload, 'enterpriseUser', index);
  }

  createCommission(payload: any, userType: string, index: number) {
    this.spinnerService.show();
    this.commissionService.createCommission(payload).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        if (userType === 'singleUser') {
          this.singleUserSlabs[index].isNew = false;
        } else if (userType === 'superUser') {
          this.superUserSlabs[index].isNew = false;
        } else if (userType === 'enterpriseUser') {
          this.enterpriseUserSlabs[index].isNew = false;
        }
        this.fetchCommissions(); // Optionally fetch updated commissions
      },
      error: (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'Failed to save commission';
        this.toastr.error(errorMessage);
      }
    });
  }

  editCommission(slab: any, userType: string, index: number) {
    const payload = {
      userType,
      slabRates: [
        {
          slabRateStart: slab.start,
          slabRateEnd: slab.end,
          commissionRate: `${slab.commission}%`,
        }
      ]
    };
    this.spinnerService.show();
    this.commissionService.editCommission(slab.id, payload).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        this.fetchCommissions(); // Optionally fetch updated commissions
      },
      error: (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'Failed to edit commission';
        this.toastr.error(errorMessage);
      }
    });
  }

  deleteCommission(userType: string, slab: any, index: number) {
    console.log('Deleting slab with ID:', slab.id); // Add logging to check the ID
  
    this.spinnerService.show();
    this.commissionService.deleteCommission(slab.id).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        if (userType === 'singleUser') {
          this.singleUserSlabs.splice(index, 1);
        } else if (userType === 'superUser') {
          this.superUserSlabs.splice(index, 1);
        } else if (userType === 'enterpriseUser') {
          this.enterpriseUserSlabs.splice(index, 1);
        }
        this.fetchCommissions(); // Optionally fetch updated commissions
      },
      error: (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'Failed to delete commission';
        this.toastr.error(errorMessage);
      }
    });
  }

  toggleSingleUserEdit() {
    this.isSingleUserEditing = !this.isSingleUserEditing;
  }

  toggleSuperUserEdit() {
    this.isSuperUserEditing = !this.isSuperUserEditing;
  }

  toggleEnterpriseUserEdit() {
    this.isEnterpriseUserEditing = !this.isEnterpriseUserEditing;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  isEditIconVisible(slab: any): boolean {
    return !slab.isNew;
  }

  removeSingleUserSlab(index: number) {
    this.deleteCommission('singleUser', this.singleUserSlabs[index], index);
  }

  removeSuperUserSlab(index: number) {
    this.deleteCommission('superUser', this.superUserSlabs[index], index);
  }

  removeEnterpriseUserSlab(index: number) {
    this.deleteCommission('enterpriseUser', this.enterpriseUserSlabs[index], index);
  }
}