import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  constructor(private http: HttpClient) {}

  getBuses(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:4000/api/buses');
  }
}
