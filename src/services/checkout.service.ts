import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class checkoutService {
  private apiUrl = 'https://naqli.onrender.com/api/checkout';

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
}
