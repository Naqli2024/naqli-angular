import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { checkoutService } from '../../../../services/checkout.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../../../services/spinner.service';
import { PaymentService } from '../../../../services/payment.service';

@Component({
  selector: 'app-payment-successful',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-successful.component.html',
  styleUrl: './payment-successful.component.css',
})
export class PaymentSuccessfulComponent {
  checkoutId: string | null = null;
  paymentStatus: string = '';


  constructor(
    private route: ActivatedRoute,
    private checkoutService: checkoutService,
    private toastr: ToastrService,
    public router: Router,
    private paymentService: PaymentService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    // Get the checkoutId from the URL parameters
    this.route.queryParams.subscribe((params) => {
      this.checkoutId = params['id'];
      this.checkPaymentStatus();
    });
  }

  checkPaymentStatus() {
    const paymentBrand = localStorage.getItem('paymentBrand');
    console.log(this.checkoutId)
    console.log(paymentBrand)
    if (!this.checkoutId || !paymentBrand) {
      this.toastr.warning('Missing data to initiate payment process.');
      return;
    }

    // Call the service to check payment status
    // Assume the checkoutService.getPaymentStatus() call returns an observable
    this.checkoutService.getPaymentStatus(this.checkoutId, paymentBrand).subscribe(
      (statusResponse) => {
        if (statusResponse?.result) {
          const resultCode = statusResponse.result.code;
          const resultDescription = statusResponse.result.description;

          if (resultCode === '000.100.110') {
            this.paymentStatus = 'Payment Successful!';
            this.toastr.success(resultDescription);
            this.paymentService.setPaymentStatus(this.paymentStatus); // Set status in service
            localStorage.removeItem('paymentBrand');
          } else {
            this.paymentStatus = 'Payment failed. Please try again.';
            this.toastr.error(resultDescription || 'Payment failed.');
            this.paymentService.setPaymentStatus(this.paymentStatus); // Set status in service
          }
        } else {
          this.paymentStatus = 'Payment status could not be retrieved.';
          this.toastr.error('No result found in the response.');
          this.paymentService.setPaymentStatus(this.paymentStatus); // Set status in service
        }
      },
      (error) => {
        const errorMessage = error?.status?.description || 'An error occurred.';
        this.toastr.error(errorMessage);
        this.paymentStatus = 'An error occurred while checking payment status.';
        this.paymentService.setPaymentStatus(this.paymentStatus); // Set status in service
      }
    );
  }
}
