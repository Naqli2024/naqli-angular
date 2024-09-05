import { Component } from '@angular/core';
import { CommissionService } from '../../../services/admin/commission.service';
import { ToastrService } from 'ngx-toastr';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { formatDateToInput } from '../../../helper/date-helper';

@Component({
  selector: 'app-commission',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './commission.component.html',
  styleUrl: './commission.component.css',
})
export class CommissionComponent {
  activeTab: string = 'singleUser'; // Default tab

  // Variables for Single User data
  singleUserSlabStart: string = '1';
  singleUserSlabEnd: string = '10';
  singleUserCommission: string = '2%';
  isSingleUserEditing: boolean = false;

  // Variables for Super User data
  superUserSlabStart: string = '0';
  superUserSlabEnd: string = '2000';
  superUserCommission: string = '4%';
  isSuperUserEditing: boolean = false;

  // Variables for Enterprise User data
  enterpriseUserSlabStart: string = '500';
  enterpriseUserSlabEnd: string = '10000';
  enterpriseUserCommission: string = '6%';
  isEnterpriseUserEditing: boolean = false;

  // Method to switch tabs
  switchTab(tab: string) {
    this.activeTab = tab;
  }

  // Toggle Single User edit mode
  toggleSingleUserEdit() {
    if (this.isSingleUserEditing) {
      // Save logic here for Single User
      console.log('Saving Single User changes:', this.singleUserSlabStart, this.singleUserSlabEnd, this.singleUserCommission);
    }
    this.isSingleUserEditing = !this.isSingleUserEditing;
  }

  // Toggle Super User edit mode
  toggleSuperUserEdit() {
    if (this.isSuperUserEditing) {
      // Save logic here for Super User
      console.log('Saving Super User changes:', this.superUserSlabStart, this.superUserSlabEnd, this.superUserCommission);
    }
    this.isSuperUserEditing = !this.isSuperUserEditing;
  }

  // Toggle Enterprise User edit mode
  toggleEnterpriseUserEdit() {
    if (this.isEnterpriseUserEditing) {
      // Save logic here for Enterprise User
      console.log('Saving Enterprise User changes:', this.enterpriseUserSlabStart, this.enterpriseUserSlabEnd, this.enterpriseUserCommission);
    }
    this.isEnterpriseUserEditing = !this.isEnterpriseUserEditing;
  }
}
