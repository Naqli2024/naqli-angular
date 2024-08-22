import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommissionService {
  private baseUrl = 'http://localhost:4000/api/admin'; 

  constructor(private http: HttpClient) {}

  // Fetch all commissions
  getCommissions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/commissions`);
  }

  // Add a new commission
  addCommission(commission: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-commission`, commission);
  }

  // Update an existing commission
  updateCommission(userType: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-commission/${userType}`, data);
  }
}