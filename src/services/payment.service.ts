import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:4000/api/api';

  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number, isAdvance: boolean): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const endpoint = isAdvance ? `${this.apiUrl}/pay-advance` : `${this.apiUrl}/pay`;
    return this.http.post<any>(endpoint, { amount }, { headers });
  }
}