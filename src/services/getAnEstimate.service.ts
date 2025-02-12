import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EstimateService {
  private apiUrl = 'https://prod.naqlee.com:443/api/get-an-estimate';

  constructor(private http: HttpClient) {}

  submitEstimate(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}