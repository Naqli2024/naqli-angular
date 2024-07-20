import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { User } from '../../../../models/user.model';
import { Partner } from '../../../../models/partnerData.model';
import { NotificationService } from '../../../../services/admin/notification.service';
import { SpinnerService } from '../../../../services/spinner.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-modal.component.html',
  styleUrl: './notification-modal.component.css',
})
export class NotificationModalComponent implements OnInit{
  @Input() isSelectedUser: boolean = true;
  @Input() users: User[] = [];
  @Input() partners: Partner[] = [];
  @Input() notification: any = null;
  messageTitle: string = '';
  messageBody: string = '';
  messageTitleCount: string = '0/50';
  messageBodyCount: string = '0/178';
  ids: string[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private notificationService: NotificationService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.extractIds();
    if (this.notification) {
      this.messageTitle = this.notification.messageTitle;
      this.messageBody = this.notification.messageBody;
      this.updateMessageTitleCount();
      this.updateMessageBodyCount();
    }
  }

  sendNotificationToAdmin() {
    const notificationData = {
      messageTitle: this.messageTitle,
      messageBody: this.messageBody,
      partnerId: this.isSelectedUser ? [] : this.ids, 
      userId: this.isSelectedUser ? this.ids : undefined
    };
    if (this.notification) {
      // Updating existing notification
      this.spinnerService.show();
      this.notificationService.updateNotification(this.notification.notificationId, notificationData)
        .subscribe(
          (response) => {
            this.spinnerService.hide();
            this.toastr.success(response.message);
            this.activeModal.close('success');
          },
          (error) => {
            this.spinnerService.hide();
            const errorMessage = error.error?.message || 'An error occurred';
            this.toastr.error(errorMessage);
          }
        );
    } else {
      this.spinnerService.show();
      this.notificationService.sendNotification(notificationData)
        .subscribe(
          (response) => {
            this.spinnerService.hide();
            this.toastr.success(response.message);
            this.activeModal.close('success');
          },
          (error) => {
            this.spinnerService.hide();
            const errorMessage = error.error?.message || 'An error occurred';
            this.toastr.error(errorMessage);
          }
        );
    }  
  }


  extractIds() {
    if (this.isSelectedUser) {
      this.ids = this.users.map(user => user._id);
    } else {
      this.ids = this.partners.map(partner => partner._id);
    }
  }


  updateMessageTitleCount() {
    this.messageTitleCount = `${this.messageTitle.length}/50`;
    if (this.messageTitle.length > 50) {
      this.messageTitle = this.messageTitle.slice(0, 50); // Limit to 50 characters
      this.messageTitleCount = '50/50';
      this.toastr.error('Message Title should not exceed 50 characters.', 'Character Limit Exceeded');
    }
  }

  updateMessageBodyCount() {
    this.messageBodyCount = `${this.messageBody.length}/178`;
    if (this.messageBody.length > 178) {
      this.messageBody = this.messageBody.slice(0, 178); // Limit to 178 characters
      this.messageBodyCount = '178/178';
      this.toastr.error('Message Body should not exceed 178 characters.', 'Character Limit Exceeded');
    }
  }
}
