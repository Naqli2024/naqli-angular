import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: google.maps.Map | undefined;
  private directionsService: google.maps.DirectionsService | undefined;
  private directionsRenderer: google.maps.DirectionsRenderer | undefined;
  private geocoder: google.maps.Geocoder | undefined;
  public isMapInitialized = false;
  public isGeocoderInitialized = false;

  initializeMapInContainer(containerId: string): void {
    const mapContainer = document.getElementById(containerId);

    if (mapContainer) {
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
  
          const route = response.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;
  
          // Create a single InfoWindow object
          const infoWindow = new google.maps.InfoWindow({
            disableAutoPan: true, // Disable auto-panning
            pixelOffset: new google.maps.Size(0, -30), // Adjust position if needed
          });
  
          route.legs.forEach((leg, index) => {
            totalDistance += leg.distance.value; // distance in meters
            totalDuration += leg.duration.value; // duration in seconds
  
            // Create polyline for each leg
            const path = leg.steps.map((step) => step.path).flat();
  
            const polyline = new google.maps.Polyline({
              path: path,
              strokeColor: '#0000FF', // Line color
              strokeOpacity: 0.7,
              strokeWeight: 5,
              map: this.map,
            });
  
            // Position the tooltip at a calculated location along the polyline
            const midpointIndex = Math.floor(path.length / 2); // Get the midpoint of the polyline path
            const midpoint = path[midpointIndex];
  
            // Set tooltip content without labels and with custom styles
            const tooltipContent = `
              <div class="custom-tooltip">
                <div>${leg.distance.text},</div>
                <div>${leg.duration.text}</div>
              </div>
            `;
  
            infoWindow.setContent(tooltipContent);
            infoWindow.setPosition(midpoint); // Set the position to the midpoint of the polyline
            infoWindow.open(this.map); // Open the tooltip at the polyline
          });
  
          // Convert totalDuration (in seconds) to hours and minutes
          const hours = Math.floor(totalDuration / 3600); // Total hours
          const minutes = Math.floor((totalDuration % 3600) / 60); // Remaining minutes
  
          console.log(`Total Distance: ${(totalDistance / 1000).toFixed(2)} km`);
          console.log(`Total Duration: ${hours} hours ${minutes} minutes`);
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