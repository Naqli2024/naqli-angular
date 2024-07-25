import { Component } from '@angular/core';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.css'
})
export class AdminUserComponent {
  users: User[] = [];
  options: string[] = ['More Options','Block User', 'Suspend User', 'Reactivate User'];

  constructor(private userService: UserService, private toastr: ToastrService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userService.getAllUsers().subscribe((users) => {
        this.users = users.map(user => ({ ...user, selected: false }));
      });
    }
  }

  onActionSelected(event: any): void {
    const action = (event.target as HTMLSelectElement).value;
    const selectedUser = this.users.find(user => user.selected);
    
    if (!selectedUser) {
      this.toastr.error('Please select a user first.');
      return;
    }

    switch (action) {
      case 'Block User':
        this.updateUserStatus(selectedUser._id, { isBlocked: true });
        break;
      case 'Suspend User':
        this.updateUserStatus(selectedUser._id, { isSuspended: true });
        break;
      case 'Reactivate User':
        this.updateUserStatus(selectedUser._id, { isBlocked: false, isSuspended: false });
        break;
      default:
        break;
    }
  }

  updateUserStatus(userId: string, status: any): void {
    this.userService.updateUserStatus(userId, status).subscribe(
      () => {
        this.toastr.success('User status updated successfully.');
        this.ngOnInit(); // Refresh user list
      },
      (error) => {
        this.toastr.error('Error updating user status.');
        console.error(error);
      }
    );
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.users.forEach(user => user.selected = isChecked);
  }
}
