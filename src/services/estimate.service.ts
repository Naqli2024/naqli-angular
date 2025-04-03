import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstimateService {
  private apiUrl = 'http://localhost:4000/estimate';

  constructor(private http: HttpClient) {}

  getEstimate(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}