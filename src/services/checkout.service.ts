import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class checkoutService {
  private apiUrl = 'https://prod.naqlee.com:443/api/checkout';
  private baseUrl = 'https://prod.naqlee.com:443/api';


  constructor(private http: HttpClient) {}

  makePayment(stripeToken: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(
      this.apiUrl,
      { token: stripeToken },
      { headers }
    );
  }

  createPayment(amount: number, paymentBrand: string, userId: any): Observable<any> {
    const body = {
      amount: amount,
      paymentBrand: paymentBrand,
      userId: userId
    }
    return this.http.post(`${this.baseUrl}/create-payment`, body);
  }
  
  getPaymentStatus(checkoutId: string, paymentBrand: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/payment-status/${checkoutId}`, {
      params: { paymentBrand },
    });
  }
}
