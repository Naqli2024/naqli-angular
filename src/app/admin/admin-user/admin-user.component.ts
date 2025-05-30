import { Component } from '@angular/core';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SpinnerService } from '../../../services/spinner.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.css',
})
export class AdminUserComponent {
  users: User[] = [];
  options: string[] = [
    'MoreOptions',
    'BlockUser',
    'SuspendUser',
    'ReactivateUser',
  ];
  isAllSelected: boolean = false;

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.spinnerService.show();

      this.userService
        .getAllUsers()
        .pipe(finalize(() => this.spinnerService.hide()))
        .subscribe(
          (users) => {
            this.users = users.map((user) => ({ ...user, selected: false }));
            this.updateSelectAllState();
          },
          (error) => {
            this.toastr.error('Error fetching user details', 'Error');
          }
        );
    }
  }

  onActionSelected(event: any): void {
    const action = (event.target as HTMLSelectElement).value;
    const selectedUsers = this.users.filter((user) => user.selected);

    if (selectedUsers.length === 0) {
      this.toastr.error('Please select at least one user.');
      return;
    }

    const statuses = {
      'BlockUser': { isBlocked: true },
      'SuspendUser': { isSuspended: true },
      'ReactivateUser': { isBlocked: false, isSuspended: false },
    };

    const statusUpdate = statuses[action];
    if (statusUpdate) {
      this.applyBulkAction(selectedUsers, statusUpdate, action);
    }
  }

  applyBulkAction(users: User[], status: any, action: string): void {
    const updateRequests = users.map((user) =>
      this.userService.updateUserStatus(user._id, status).toPromise()
    );

    Promise.all(updateRequests)
      .then(() => {
        this.toastr.success(
          `Successfully performed "${action}" action on selected users.`
        );
        this.ngOnInit(); // Refresh user list
      })
      .catch(() => {
        this.toastr.error('Error performing the action on selected users.');
      });
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.users.forEach((user) => (user.selected = isChecked));
    this.isAllSelected = isChecked;
  }

  updateSelectAllState(): void {
    this.isAllSelected = this.users.every((user) => user.selected);
  }
}
