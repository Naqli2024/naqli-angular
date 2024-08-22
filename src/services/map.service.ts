import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: google.maps.Map | undefined;
  private directionsService: google.maps.DirectionsService | undefined;
  private directionsRenderer: google.maps.DirectionsRenderer | undefined;
  private geocoder: google.maps.Geocoder | undefined;
  private isMapInitialized = false;
  private isGeocoderInitialized = false;


  initializeMapInContainer(containerId: string): void {
    const mapContainer = document.getElementById(containerId);

    if (mapContainer) {
      // Check if mapContainer has dimensions
      if (mapContainer.clientWidth === 0 || mapContainer.clientHeight === 0) {
        console.error('Map container has no size.');
        return;
      }
  
      this.map = new google.maps.Map(mapContainer, {
        center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        zoom: 10,
      });
  
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(this.map);
      this.geocoder = new google.maps.Geocoder();

      this.isMapInitialized = true;
      this.isGeocoderInitialized = true;
    } else {
      console.error(`Container with id "${containerId}" not found.`);
    }
  }

  calculateRoute(start: string, waypoints: string[], end: string): void {
    if (!this.directionsService || !this.directionsRenderer || !this.map) {
      console.error('Map or Directions Service not initialized.');
      return;
    }

    const waypts = waypoints.map((waypoint) => ({
      location: waypoint,
      stopover: true,
    }));

    this.directionsService.route(
      {
        origin: start,
        destination: end,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.directionsRenderer?.setDirections(response);
        } else {
          console.error('Directions request failed due to ', status);
        }
      }
    );
  }

  markLocation(address: string, city: string): void {
    if (!this.isGeocoderInitialized || !this.isMapInitialized) {
      console.error('Geocoder or Map not initialized.');
      return;
    }

    // Combine address and city into one string
    const fullAddress = `${address}, ${city}`;

    if (this.geocoder && this.map) {
      this.geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          const location = results[0].geometry.location;
          this.map?.setCenter(location);
          new google.maps.Marker({
            map: this.map,
            position: location,
            title: fullAddress
          });
        } else {
          console.error('Geocode was not successful for the following reason: ' + status);
        }
      });
    } else {
      console.error('Geocoder or Map not initialized.');
    }
  }
}