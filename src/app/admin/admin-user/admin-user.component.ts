import { Component } from '@angular/core';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.css'
})
export class AdminUserComponent {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userService.getAllUsers().subscribe((users) => {
        this.users = users;
      });
    }
  }
}
