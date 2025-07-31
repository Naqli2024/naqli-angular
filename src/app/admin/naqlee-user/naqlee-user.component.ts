import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, NgForm, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NaqleeUserService } from '../../../services/admin/naqleeUser.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-naqlee-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    TranslateModule,
  ],
  templateUrl: './naqlee-user.component.html',
  styleUrl: './naqlee-user.component.css',
})
export class NaqleeUserComponent {
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;

  newUser = {
    name: '',
    emailID: '',
    mobileNo: '',
    address: '',
    accessTo: [],
    userPhoto: null as File | null,
  };

  dropdownList = [
    { id: 1, itemName: 'Payout' },
    { id: 2, itemName: 'Support tickets' },
    { id: 3, itemName: 'User' },
    { id: 4, itemName: 'Partner' },
    { id: 5, itemName: 'Payments' },
    { id: 6, itemName: 'Notification Management' },
    { id: 7, itemName: 'Naqlee user' },
  ];

  selectedItems: string[] = [];
  naqleeUsers: any[] = [];
  showAddUserForm = false;
  isEditMode = false;
  currentUserId: string | null = null;

  constructor(
    private naqleeUserService: NaqleeUserService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.fetchNaqleeUsers();
  }

  fetchNaqleeUsers() {
    this.spinnerService.show();
    this.naqleeUserService.getAllNaqleeUsers().subscribe(
      (response) => {
        this.spinnerService.hide();
        this.naqleeUsers = response.data;
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage);
      }
    );
  }

  toggleFormVisibility() {
    this.showAddUserForm = !this.showAddUserForm;
  }

  onSubmit() {
    const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes

    // Check photo size before uploading
  if (this.newUser.userPhoto && this.newUser.userPhoto.size > MAX_FILE_SIZE) {
    this.toastr.error('Photo must be less than 100KB');
    return;
  }

    const formData = new FormData();
    formData.append('name', this.newUser.name);
    formData.append('emailID', this.newUser.emailID);
    formData.append('mobileNo', this.newUser.mobileNo);
    formData.append('address', this.newUser.address);
    this.selectedItems.forEach((access) => {
      formData.append('accessTo', access);
    });
    if (this.newUser.userPhoto) {
      formData.append('userPhoto', this.newUser.userPhoto);
    }

    this.spinnerService.show();
    if (this.isEditMode && this.currentUserId) {
      // Update existing user
      this.naqleeUserService.updateUser(this.currentUserId, formData).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success('NaqleeUser updated successfully');
          this.resetForm();
          this.showAddUserForm = false;
          this.fetchNaqleeUsers(); // Refresh the user list after update
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage);
        }
      );
    } else {
      // Add new user
      this.naqleeUserService.addUser(formData).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success('NaqleeUser created successfully');
          this.resetForm();
          this.showAddUserForm = false;
          this.fetchNaqleeUsers(); // Refresh the user list after adding
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage);
        }
      );
    }
  }

  resetForm() {
    this.newUser = {
      name: '',
      emailID: '',
      mobileNo: '',
      address: '',
      accessTo: [],
      userPhoto: null,
    };
    this.selectedItems = [];
    this.showAddUserForm = false;
    this.isEditMode = false;
    this.currentUserId = null;
  }

  toggleSelection(itemId: number) {
    const index = this.selectedItems.indexOf(
      this.dropdownList.find((item) => item.id === itemId)?.itemName || ''
    );
    if (index === -1) {
      this.selectedItems.push(
        this.dropdownList.find((item) => item.id === itemId)?.itemName || ''
      );
    } else {
      this.selectedItems.splice(index, 1);
    }
  }

  isSelected(itemId: number): boolean {
    const item = this.dropdownList.find((i) => i.id === itemId);
    return item ? this.selectedItems.includes(item.itemName) : false;
  }

  getSelectedItemsText(): string {
    return this.selectedItems.join(', ');
  }

  handleFileInput(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.newUser.userPhoto = file;
    }
  }

  editUser(user: any) {
    this.isEditMode = true;
    this.currentUserId = user._id;
    this.newUser = {
      name: user.name,
      emailID: user.emailID,
      mobileNo: user.mobileNo,
      address: user.address,
      accessTo: user.accessTo,
      userPhoto: null, // Initialize userPhoto as null
    };
    this.selectedItems = user.accessTo;
    this.showAddUserForm = true;
  }

  deleteUser(userId: string) {
    this.spinnerService.show();
    this.naqleeUserService.deleteNaqleeUser(userId).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.toastr.success('NaqleeUser deleted successfully');
        this.fetchNaqleeUsers();
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage);
      }
    );
  }

  getTranslatedAccessTo(accessTo: string[]): string {
    const translatedItems = accessTo.map((item) =>
      this.translate.instant(item)
    );
    return translatedItems.join(', ');
  }
}
