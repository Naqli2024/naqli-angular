import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { FormsModule, NgForm } from '@angular/forms';
import { ReportSupportService } from '../../../../../services/report/report.service';
import { ToastrService } from 'ngx-toastr';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../../../services/user.service';
import { PartnerService } from '../../../../../services/partner/partner.service';
import { User } from '../../../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-report-support',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './report-support.component.html',
  styleUrl: './report-support.component.css',
})
export class ReportSupportComponent {
  file: File | null = null;
  email: string = '';
  reportMessage: string = '';
  userId: string | null = '';
  partnerId: string | null = '';
  emailAddress: string = '';

  constructor(
    private reportSupportService: ReportSupportService,
    private toastr: ToastrService,
    public activeModal: NgbActiveModal,
    private userService: UserService,
    private partnerService: PartnerService
  ) {}

  ngOnInit() {
    this.userId = localStorage.getItem('userId');
    this.partnerId = localStorage.getItem('partnerId');
    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe(
        (user: User) => {
          this.emailAddress = user.emailAddress;
        },
        (error) => {
          console.error('Error fetching user data:', error);
        }
      );
    } else if (this.partnerId) {
      this.partnerService.getPartnerDetails(this.partnerId).subscribe(
        (partner: any) => {
          this.emailAddress = partner?.data?.email;
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
    } else {
      console.error('Neither userId nor partnerId found');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.file = event.dataTransfer.files[0];
    }
    this.removeDragoverClass(event);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.addDragoverClass(event);
  }

  onDragLeave(event: DragEvent): void {
    this.removeDragoverClass(event);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      this.file = target.files[0];
    }
  }

  private addDragoverClass(event: DragEvent): void {
    (event.target as HTMLElement).classList.add('dragover');
  }

  private removeDragoverClass(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('dragover');
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      const formData = new FormData();
      formData.append('email', this.email);
      formData.append('reportMessage', this.reportMessage);
      if (this.file) {
        formData.append('pictureOfTheReport', this.file, this.file.name);
      }

      this.reportSupportService.submitReportRequest(formData).subscribe(
        (response) => {
          this.toastr.success(response.message);
          this.clearForm();
          this.closeModal();
        },
        (error) => {
          this.toastr.error('Error submitting report:', error);
          this.clearForm();
        }
      );
    } else {
      this.toastr.error('Please fill in all required fields');
    }
  }

  private clearForm(): void {
    this.email = '';
    this.reportMessage = '';
    this.file = null;
    // Reset the form if using ngForm
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      form.reset();
    }
  }

  private closeModal(): void {
    this.activeModal.close();
  }
}
