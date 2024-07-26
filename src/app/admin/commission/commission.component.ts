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
  commissions: any[] = [];
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;

  constructor(
    private commissionService: CommissionService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchCommissions();
  }

  fetchCommissions(): void {
    this.commissionService.getCommissions().subscribe({
      next: (response) => {
        this.commissions = response.data.map((commission: any) => {
          return {
            ...commission,
            effectiveDate: formatDateToInput(commission.effectiveDate)
          };
        });
      },
      error: (err) => {
        console.error('Error fetching commissions:', err);
      }
    });
  }

  saveCommission(commission: any): void {
    const updatedData = {
      commissionRate: Number(commission.commissionRate),
      effectiveDate: new Date(commission.effectiveDate).toISOString()
    };
    console.log(commission.userType, updatedData)

    this.commissionService.updateCommission(commission.userType, updatedData).subscribe({
      next: (response) => {
        this.toastr.success(response.message);
      },
      error: (err) => {
        this.toastr.error('Error updating commission:', err);
      }
    });
  }
}
