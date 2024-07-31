import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private map!: google.maps.Map;
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;

  private googleMapsApiKey: string = environment.googleMapsApiKey;

  constructor() {
    this.loadGoogleMapsScript();
  }

  private loadGoogleMapsScript(): void {
    if (typeof window['google'] === 'undefined') {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places`;
      script.defer = true;
      script.onload = () => this.initializeMap();
      document.head.appendChild(script);
    } else {
      this.initializeMap();
    }
  }

  private initializeMap(): void {
    if (window['google']) {
      this.map = new google.maps.Map(document.createElement('div'), {
        zoom: 12,
        center: { lat: 37.7749, lng: -122.4194 }, // Default center (San Francisco)
      });

      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(this.map);
    }
  }

  public initializeMapInContainer(containerId: string): void {
    if (window['google']) {
      this.map = new google.maps.Map(
        document.getElementById(containerId) as HTMLElement,
        {
          zoom: 12,
          center: { lat: 37.7749, lng: -122.4194 }, // Default center
        }
      );

      this.directionsRenderer.setMap(this.map);
    }
  }

  public calculateRoute(start: string, waypoints: string[], end: string): void {
    if (!this.directionsService || !this.directionsRenderer) {
      console.error('Google Maps services are not initialized.');
      return;
    }

    const waypointsArray = waypoints.map((point) => ({
      location: point,
      stopover: true,
    }));

    const request: google.maps.DirectionsRequest = {
      origin: start,
      destination: end,
      waypoints: waypointsArray,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    this.directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
      } else {
        console.error('Directions request failed due to ' + status);
      }
    });
  }
}
