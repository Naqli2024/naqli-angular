import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommissionService {
  private baseUrl = 'http://localhost:4000/api/admin'; 

  constructor(private http: HttpClient) {}

  // Fetch all commissions
  createCommission(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.baseUrl}/create-commission`, data, { headers });
  }

  getCommissions(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getAllCommissions`);
  }
}