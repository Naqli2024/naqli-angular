import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { Partner } from '../../../models/partnerData.model';
import { PartnerService } from '../../../services/partner/partner.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../../services/admin/notification.service';
import { FormsModule } from '@angular/forms';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-admin-notification-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './admin-notification-management.component.html',
  styleUrl: './admin-notification-management.component.css',
})
export class AdminNotificationManagementComponent implements OnInit {
  buttonText: string = 'Create New Notification';
  isPushNotificationMode: boolean = false;
  isUserTab: boolean = true;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = []; 
  partners: Partner[] = [];
  filteredPartners: Partner[] = [];
  selectedPartners: Partner[] = []; 
  allUsersSelected: boolean = false; 
  allPartnersSelected: boolean = false; 
  lastNotification: { [key: string]: any } = {};
  searchTerm: string = '';
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;

  constructor(
    private userService: UserService,
    private partnerService: PartnerService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = [...this.users];
      this.fetchUsersLastNotifications();
      this.updateFilteredResults(); 
      this.fetchAllNotifications();
    });

    this.partnerService.getAllPartners().subscribe(
      (response: any) => {
        if (response && response.data) {
          this.partners = response.data;
          this.filteredPartners = [...this.partners];
          this.fetchPartnersLastNotifications();
        } else {
          console.error('Invalid response format from backend');
        }
      },
      (error: any) => {
        console.error('Error fetching partner details:', error);
      }
    );
  }

  fetchAllNotifications(): void {
    this.notificationService.getAllNotification().subscribe(
      (response: any) => {
        this.notifications = response.allNotifications || [];
        this.filteredNotifications = [...this.notifications]; 
        this.filterNotifications();
      },
      (error) => {
        console.error('Error fetching notifications', error);
      }
    );
  }

  fetchUsersLastNotifications() {
    this.users.forEach((user) => {
      if(user.notifications.length>0){
        const lastNotification = user.notifications[user.notifications.length - 1];
        user.lastNotification = lastNotification
      }
    });
  }

  fetchPartnersLastNotifications() {
    this.partners.forEach((partner) => {
      if (partner.notifications.length > 0) {
        const lastNotification = partner.notifications[partner.notifications.length - 1];
        partner.lastNotification = lastNotification;
      }
    });
  }

  toggleNotificationState() {
    if (!this.isPushNotificationMode) {
      this.buttonText = 'Send Push Notification';
      this.isPushNotificationMode = true;
    } else {
      this.sendPushNotification(); // Call sendPushNotification directly if already in push notification mode
    }
  }

  selectTab(tab: string) {
    this.isUserTab = tab === 'user';
    this.searchTerm = '';
    this.updateFilteredResults();
  }

  // Method to handle checkbox selection
  selectUser(user: User, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedUsers.push(user);
    } else {
      this.selectedUsers = this.selectedUsers.filter((u) => u !== user);
    }
  }

  // Method to handle checkbox selection
  selectPartner(partner: Partner, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedPartners.push(partner);
    } else {
      this.selectedPartners = this.selectedPartners.filter((p) => p !== partner);
    }
  }

  // Method to toggle selection of all users
  toggleAllUsers() {
    this.allUsersSelected = !this.allUsersSelected;
    if (this.allUsersSelected) {
      this.selectedUsers = [...this.users];
    } else {
      this.selectedUsers = [];
    }
  }

  // Method to toggle selection of all partners
  toggleAllPartners() {
    this.allPartnersSelected = !this.allPartnersSelected;
    if (this.allPartnersSelected) {
      this.selectedPartners = [...this.partners];
    } else {
      this.selectedPartners = [];
    }
  }

  sendPushNotification() {
    if (this.isUserTab) {
      if (this.selectedUsers.length > 0) {
        this.openNotificationModal(true, this.selectedUsers);
      } else {
        this.toastr.error('Please select at least one user.', 'No User Selected');
      }
    } else {
      if (this.selectedPartners.length > 0) {
        this.openNotificationModal(false, this.selectedPartners);
      } else {
        this.toastr.error('Please select at least one partner.', 'No Partner Selected');
      }
    }
  }
  
  openNotificationModal(isSelectedUser: boolean, data: User[] | Partner[]): void {
    const modalRef = this.modalService.open(NotificationModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'custom-modal-width',
    });
  
    modalRef.componentInstance.isSelectedUser = isSelectedUser;
    if (isSelectedUser) {
      modalRef.componentInstance.users = data as User[];
    } else {
      modalRef.componentInstance.partners = data as Partner[];
    }
  }

  openEditNotificationModal(notification: any): void {
    const modalRef = this.modalService.open(NotificationModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'custom-modal-width',
    });
  
    modalRef.componentInstance.notification = notification;
  }

  onSearchTermChange() {
    this.updateFilteredResults();
    this.filterNotifications();
  }

  updateFilteredResults() {
    const searchTermLower = this.searchTerm.toLowerCase();

    if (this.isUserTab) {
      this.filteredUsers = this.users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTermLower) ||
        user._id.toLowerCase().includes(searchTermLower) ||
        user.emailAddress.toLowerCase().includes(searchTermLower) ||
        user.contactNumber.toString().toLowerCase().includes(searchTermLower)
      );
    } else {
      this.filteredPartners = this.partners.filter(partner =>
        partner.partnerName.toLowerCase().includes(searchTermLower) ||
        partner._id.toLowerCase().includes(searchTermLower) ||
        partner.email.toLowerCase().includes(searchTermLower) ||
        partner.mobileNo.toLowerCase().includes(searchTermLower)
      );
    }
  }

  filterNotifications() {
    const searchTermLower = this.searchTerm.toLowerCase();
  
    // Filter notifications based on search term
    this.filteredNotifications = this.notifications.filter(notification =>
      (notification.userName && notification.userName.toLowerCase().includes(searchTermLower)) ||
      (notification.partnerName && notification.partnerName.toLowerCase().includes(searchTermLower)) ||
      (notification.messageTitle && notification.messageTitle.toLowerCase().includes(searchTermLower))
    );
  }

  deleteNotification(notificationId: string) {
    this.notificationService.deleteNotification(notificationId).subscribe(
      (response) => {
        this.toastr.success(response.message);
        this.fetchAllNotifications();
      },
      (error) => {
        this.toastr.error('Error deleting notification');
        console.error(error);
      }
    );
  }
}
