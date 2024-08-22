import { Injectable } from '@angular/core';
import { environment } from '../../src/environments/environment.prod';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {

  private isScriptLoaded = false;

  constructor(private http: HttpClient) {}

  loadGoogleMapsScript(): void {
    if (this.isScriptLoaded) {
      return;
    }

    this.isScriptLoaded = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  getGeocode(address: string): Observable<any> {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${environment.googleMapsApiKey}`;
    return this.http.get(url);
  }
}