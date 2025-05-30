import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CompanyDetailsService {
  private apiUrl = 'https://prod.naqlee.com:443/api/partner';
  constructor(private http: HttpClient) {}

  addCompanyDetails(partnerId: string, companyDetails: any): Observable<any> {
    const url = `${this.apiUrl}/${partnerId}/company-details`;
    return this.http.post<any>(url, companyDetails);
  }

  editCompanyDetails(partnerId: string, companyDetails: any): Observable<any> {
    const url = `${this.apiUrl}/edit-company-details/${partnerId}`;
    return this.http.put<any>(url, companyDetails);
  }
}
