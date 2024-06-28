import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  profilePhoto: string = 'assets/images/Group 6.svg';
  firstName= localStorage.getItem('firstName');
  lastName = localStorage.getItem('lastName');
  username: string = 'user name';
}
