import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = 'https://prod.naqlee.com:443/api/api';
  private paymentDetails: {
    amount: number;
    status: string;
    partnerId: string;
    oldQuotePrice: number;
  } | null = null;
  private paymentStatusSource = new BehaviorSubject<string>('');
  paymentStatus$ = this.paymentStatusSource.asObservable();

  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number, isAdvance: boolean): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const endpoint = isAdvance
      ? `${this.apiUrl}/pay-advance`
      : `${this.apiUrl}/pay`;
    return this.http.post<any>(endpoint, { amount }, { headers });
  }

  // Method to update payment status
  setPaymentStatus(status: string) {
    this.paymentStatusSource.next(status);
  }

  getPaymentStatus() {
    return this.paymentStatusSource.getValue();
  }

  // Method to clear the payment status
  clearPaymentStatus() {
    this.paymentStatusSource.next(''); // Clear payment status
  }

  // Set payment details
  setPaymentDetails(details: {
    amount: number;
    status: string;
    partnerId: string;
    oldQuotePrice: number;
  }) {
    localStorage.setItem('details', JSON.stringify(details));
  }

  // Get payment details
  getPaymentDetails() {
    const storedDetails = localStorage.getItem('details');
    console.log(storedDetails)
    return storedDetails ? JSON.parse(storedDetails) : null;
  }

  // Clear payment details if needed
  clearPaymentDetails() {
    this.paymentDetails = null;
    localStorage.removeItem('details');
  }
}
