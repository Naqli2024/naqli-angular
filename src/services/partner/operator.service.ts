import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  private baseUrl = 'http://localhost:4000/api/partner';

  constructor(private http: HttpClient) {}

  addOperator(operatorData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/add-operator`, operatorData);
  }
}