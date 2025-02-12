import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { EstimateService } from '../../../services/getAnEstimate.service';

@Component({
  selector: 'app-open-get-estimate',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './open-get-estimate.component.html',
  styleUrl: './open-get-estimate.component.css',
})
export class OpenGetEstimateComponent {
  userForm: FormGroup;
  successMessage: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private estimateService: EstimateService
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });
  }

  items = [
    {
      image: 'assets/images/vehicle.svg',
      name: 'Vehicle',
    },
    { image: 'assets/images/bus.svg', name: 'Bus' },
    {
      image: 'assets/images/equipment.svg',
      name: 'Equipment',
    },
    {
      image: 'assets/images/special.svg',
      name: 'Special',
    },
    {
      image: 'assets/images/others.svg',
      name: 'Others',
    },
  ];
  getRoute(name: string): string {
    return `/home/user/${name.toLowerCase()}-estimate`;
  }

  dismissModal(): void {
    this.activeModal.dismiss();
  }

  submitForm() {
    if (this.userForm.valid) {
      this.estimateService.submitEstimate(this.userForm.value).subscribe(
        (response) => {
          if (response.success) {
            this.successMessage = response.message;
            this.toastr.success(this.successMessage);
            this.userForm.reset();
            this.activeModal.dismiss();
          }
        },
        (error) => {
          console.log(error)
          this.toastr.error('Error submitting form', error);
        }
      );
    }
  }
}
