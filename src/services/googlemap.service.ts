import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.prod';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {

  private isScriptLoaded = false;

  constructor(private http: HttpClient) {}

  loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isScriptLoaded) {
        resolve(); // Script is already loaded
        return;
      }
  
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
  
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(); // Script loaded successfully
      };
  
      script.onerror = (error) => {
        reject(error); // Failed to load script
      };
  
      document.head.appendChild(script);
    });
  }

  getGeocode(address: string): Observable<any> {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${environment.googleMapsApiKey}`;
    return this.http.get(url);
  }
}

