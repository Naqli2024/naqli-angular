import { Component } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './delete-user.component.html',
  styleUrl: './delete-user.component.css',
})
export class DeleteUserComponent {
  isModalOpen: boolean = false;
  userId: string | null = localStorage.getItem('userId'); 

  constructor(
    private userService: UserService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  deleteUser() {
    if (!this.userId) {
      this.toastr.error('User ID not found');
      return;
    }

    this.userService.deleteUser(this.userId).subscribe({
      next: (response) => {
        this.toastr.success(response.message);
        localStorage.clear();
        this.router.navigate(['/home/user']);
      },
      error: (error) => {
        this.toastr.error(error);
      },
    });

    this.closeModal();
  }
}
