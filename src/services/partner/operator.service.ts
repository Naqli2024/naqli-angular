import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  private baseUrl = 'https://naqlee.com/api/partner';

  constructor(private http: HttpClient) {}

  addOperator(operatorData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/add-operator`, operatorData);
  }

  addExtraOperator(operatorData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/add-extra-operator`, operatorData);
  }
}