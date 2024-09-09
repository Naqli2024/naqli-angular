import { Component, OnInit } from '@angular/core';
import { CommissionService } from '../../../services/admin/commission.service';
import { ToastrService } from 'ngx-toastr';
import { faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { formatDateToInput } from '../../../helper/date-helper';
import { SpinnerService } from '../../../services/spinner.service';
import { Slab } from '../../../models/slab.model';

@Component({
  selector: 'app-commission',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './commission.component.html',
  styleUrl: './commission.component.css',
})

export class CommissionComponent implements OnInit {
  activeTab: string = 'singleUser';
  isSingleUserEditing: boolean[] = [];
  isSuperUserEditing: boolean[] = [];
  isEnterpriseUserEditing: boolean[] = [];

  singleUserSlabs: Slab[] = [{ start: '', end: '', commission: 0, isNew: false }];
  superUserSlabs: Slab[] = [{ start: '', end: '', commission: 0, isNew: false }];
  enterpriseUserSlabs: Slab[] = [{ start: '', end: '', commission: 0, isNew: false }];

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
        const errorMessage =
          error.error?.message || 'Failed to load commission data';
        this.toastr.error(errorMessage);
      },
    });
  }

  processCommissionData(commissions: any[]) {
    commissions.forEach((commission) => {
      const slabData = commission.slabRates.map((slab) => ({
        id: slab._id,
        start: slab.slabRateStart,
        end: slab.slabRateEnd,
        commission: parseFloat(slab.commissionRate), // Convert to number
        isNew: false,
      }));

      if (commission.userType === 'Single User') {
        this.singleUserSlabs = slabData;
        this.isSingleUserEditing = Array(slabData.length).fill(false);
      } else if (commission.userType === 'Super User') {
        this.superUserSlabs = slabData;
        this.isSuperUserEditing = Array(slabData.length).fill(false);
      } else if (commission.userType === 'Enterprise User') {
        this.enterpriseUserSlabs = slabData;
        this.isEnterpriseUserEditing = Array(slabData.length).fill(false);
      }
    });
  }

  addSingleUserSlab() {
    this.singleUserSlabs.push({
      start: '',
      end: '',
      commission: 0,
      isNew: true,
    });
    this.isSingleUserEditing.push(true);
  }

  addSuperUserSlab() {
    this.superUserSlabs.push({
      start: '',
      end: '',
      commission: 0,
      isNew: true,
    });
    this.isSuperUserEditing.push(true);
  }

  addEnterpriseUserSlab() {
    this.enterpriseUserSlabs.push({
      start: '',
      end: '',
      commission: 0,
      isNew: true,
    });
    this.isEnterpriseUserEditing.push(true);
  }

  saveNewSingleUserSlab(index: number) {
    const newSlab = this.singleUserSlabs[index];
    const payload = {
      userType: 'Single User',
      slabRates: [
        {
          slabRateStart: newSlab.start,
          slabRateEnd: newSlab.end,
          commissionRate: newSlab.commission, // Ensure this is a number
        },
      ],
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
          commissionRate: newSlab.commission // Ensure this is a number
        },
      ],
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
          commissionRate: newSlab.commission // Ensure this is a number
        },
      ],
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
          this.isSingleUserEditing[index] = false;
        } else if (userType === 'superUser') {
          this.isSuperUserEditing[index] = false;
        } else if (userType === 'enterpriseUser') {
          this.isEnterpriseUserEditing[index] = false;
        }
        this.fetchCommissions(); // Optionally fetch updated commissions
      },
      error: (error) => {
        this.spinnerService.hide();
        const errorMessage =
          error.error?.message || 'Failed to save commission';
        this.toastr.error(errorMessage);
      },
    });
  }

  editCommission(slab: any, userType: string, index: number) {
    const payload = {
      slabRateStart: slab.start,
      slabRateEnd: slab.end,
      commissionRate: Number(slab.commission) 
    };

    this.spinnerService.show();
    this.commissionService.editCommission(slab.id, payload).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        this.fetchCommissions();
      },
      error: (error) => {
        this.spinnerService.hide();
        console.error('Edit Commission Error:', error);
        const errorMessage = error.error?.message || 'Failed to edit commission';
        this.toastr.error(errorMessage);
      },
    });
  }
  
  deleteCommission(userType: string, slab: any, index: number) {
    this.spinnerService.show();
    this.commissionService.deleteCommission(slab.id).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        if (userType === 'singleUser') {
          this.singleUserSlabs.splice(index, 1);
          this.isSingleUserEditing.splice(index, 1);
        } else if (userType === 'superUser') {
          this.superUserSlabs.splice(index, 1);
          this.isSuperUserEditing.splice(index, 1);
        } else if (userType === 'enterpriseUser') {
          this.enterpriseUserSlabs.splice(index, 1);
          this.isEnterpriseUserEditing.splice(index, 1);
        }
        this.fetchCommissions(); // Optionally fetch updated commissions
      },
      error: (error) => {
        this.spinnerService.hide();
        const errorMessage =
          error.error?.message || 'Failed to delete commission';
        this.toastr.error(errorMessage);
      },
    });
  }

  toggleEdit(index: number, userType: string) {
    if (userType === 'singleUser') {
      if (this.isSingleUserEditing[index]) {
        // Save the commission changes
        this.editCommission(this.singleUserSlabs[index], 'singleUser', index);
      } else {
        this.isSingleUserEditing[index] = true;
      }
    } else if (userType === 'superUser') {
      if (this.isSuperUserEditing[index]) {
        // Save the commission changes
        this.editCommission(this.superUserSlabs[index], 'superUser', index);
      } else {
        this.isSuperUserEditing[index] = true;
      }
    } else if (userType === 'enterpriseUser') {
      if (this.isEnterpriseUserEditing[index]) {
        // Save the commission changes
        this.editCommission(this.enterpriseUserSlabs[index], 'enterpriseUser', index);
      } else {
        this.isEnterpriseUserEditing[index] = true;
      }
    }
  }

  isEditing(index: number, userType: string): boolean {
    if (userType === 'singleUser') {
      return this.isSingleUserEditing[index];
    } else if (userType === 'superUser') {
      return this.isSuperUserEditing[index];
    } else if (userType === 'enterpriseUser') {
      return this.isEnterpriseUserEditing[index];
    }
    return false;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  removeSingleUserSlab(index: number) {
    this.deleteCommission('singleUser', this.singleUserSlabs[index], index);
  }

  removeSuperUserSlab(index: number) {
    this.deleteCommission('superUser', this.superUserSlabs[index], index);
  }

  removeEnterpriseUserSlab(index: number) {
    this.deleteCommission(
      'enterpriseUser',
      this.enterpriseUserSlabs[index],
      index
    );
  }
}