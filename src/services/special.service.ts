import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpecialService {

  constructor(private http: HttpClient) {}

  getSpecialUnits(): Observable<any[]> {
    return this.http.get<any[]>('https://prod.naqlee.com:443/api/special-units');
  }
}
