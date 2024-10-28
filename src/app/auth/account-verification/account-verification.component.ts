import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../services/user.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-account-verification',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule],
  templateUrl: './account-verification.component.html',
  styleUrl: './account-verification.component.css',
})
export class AccountVerificationComponent {
  userDetails: any;

  constructor(
    public activeModal: NgbActiveModal,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userDetails = this.userService.getUserDetails(); 
  }
}
