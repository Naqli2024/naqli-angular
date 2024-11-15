import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CompanyDetailsService {
  private apiUrl = 'https://naqlee.com/api/partner';
  constructor(private http: HttpClient) {}

  addCompanyDetails(partnerId: string, companyDetails: any): Observable<any> {
    const url = `${this.apiUrl}/${partnerId}/company-details`;
    return this.http.post<any>(url, companyDetails);
  }
}
