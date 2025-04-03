import { Injectable } from '@angular/core';
import { DriverLocationService } from './partner/driver-location.service';
import { throttle } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private map: google.maps.Map | undefined;
  private directionsService: google.maps.DirectionsService | undefined;
  private directionsRenderer: google.maps.DirectionsRenderer | undefined;
  private geocoder: google.maps.Geocoder | undefined;
  public isMapInitialized = false;
  public isGeocoderInitialized = false;
  private driverMarker: google.maps.Marker | null = null;
  private operatorId: string = '';
  private locationUpdateInterval: any;
  private lastKnownLocation: { latitude: number; longitude: number } | null = null;

  constructor(
    private driverLocationService: DriverLocationService,
  ) {}

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

  centerMapAtUserLocation(): void {
    if (!this.map) {
      console.error('Map is not initialized.');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );

          this.map!.setCenter(userLocation);
          this.map!.setZoom(14);

          // Add a translucent blue circle behind the user's location
          const blueShadowCircle = new google.maps.Circle({
            strokeColor: '#4285F4',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#4285F4',
            fillOpacity: 0.3,
            map: this.map!,
            center: userLocation,
            radius: 100,
          });

          // Create a white border circle (larger than the blue circle)
          const whiteBorderCircle = new google.maps.Circle({
            strokeColor: '#FFFFFF',
            strokeOpacity: 1.0,
            strokeWeight: 5,
            fillColor: '#FFFFFF',
            fillOpacity: 1,
            map: this.map!,
            center: userLocation,
            radius: 60,
          });

          // Create the inner blue circle with no shadow
          const blueCircle = new google.maps.Circle({
            strokeColor: '#4285F4',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#4285F4',
            fillOpacity: 0.7,
            map: this.map!,
            center: userLocation,
            radius: 60,
          });

          blueShadowCircle.setOptions({ zIndex: 0 });
          whiteBorderCircle.setOptions({ zIndex: 1 });
          blueCircle.setOptions({ zIndex: 2 });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  calculateRoute(start: string, waypoints: string[], end: string): void {
    if (!this.directionsService || !this.directionsRenderer || !this.map) {
      console.error('Map or Directions Service not initialized.');
      return;
    }

    const cacheKey = `route_${start}_${waypoints.join('_')}_${end}`;
    const cachedRoute = localStorage.getItem(cacheKey);

    if (cachedRoute) {
      const parsedRoute = JSON.parse(cachedRoute);
      const cacheTimestamp = parsedRoute.timestamp || 0;
      const currentTime = Date.now();
      const CACHE_EXPIRATION_TIME = 3600000; // 1 hour (in milliseconds)

      if (currentTime - cacheTimestamp < CACHE_EXPIRATION_TIME) {
        this.directionsRenderer?.setDirections(parsedRoute.data);
        this.displayRouteInfo(parsedRoute.data.routes[0]);
        console.log('Route loaded from cache.');
        return;
      } else {
        console.log('Cache expired, fetching new route...');
      }
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
          const cacheData = {
            data: response,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          this.directionsRenderer?.setDirections(response);
          this.displayRouteInfo(response.routes[0]);
          console.log('Route calculated and cached.');
        } else {
          console.error('Directions request failed due to ', status);
        }
      }
    );
  }

  private displayRouteInfo(route: google.maps.DirectionsRoute): void {
    if (!this.map) {
      return;
    }

    let totalDistance = 0;
    let totalDuration = 0;

    const infoWindow = new google.maps.InfoWindow({
      disableAutoPan: true,
      pixelOffset: new google.maps.Size(0, -30),
    });

    route.legs.forEach((leg) => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;

      const path = leg.steps.map((step) => step.path).flat();
      const polyline = new google.maps.Polyline({
        path: path,
        strokeColor: '#0000FF',
        strokeOpacity: 0.7,
        strokeWeight: 5,
        map: this.map,
      });

      const midpointIndex = Math.floor(path.length / 2);
      const midpoint = path[midpointIndex];

      const tooltipContent = `
        <div class="custom-tooltip">
          <div>${leg.distance.text},</div>
          <div>${leg.duration.text}</div>
        </div>
      `;

      infoWindow.setContent(tooltipContent);
      infoWindow.setPosition(midpoint);
      infoWindow.open(this.map);
    });

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
  }

  markLocation(address: string, city: string): void {
    if (!this.isGeocoderInitialized || !this.isMapInitialized) {
      console.error('Geocoder or Map not initialized.');
      return;
    }

    const fullAddress = `${address}, ${city}`;
    const cacheKey = `geocode_${fullAddress}`;
    const cachedLocation = localStorage.getItem(cacheKey);

    if (cachedLocation) {
      const location = JSON.parse(cachedLocation);
      this.map?.setCenter(location);
      new google.maps.Marker({
        map: this.map,
        position: location,
        title: fullAddress,
      });
      console.log('Location loaded from cache.');
      return;
    }

    if (this.geocoder && this.map) {
      this.geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          const location = results[0].geometry.location;
          localStorage.setItem(cacheKey, JSON.stringify(location));
          this.map?.setCenter(location);
          new google.maps.Marker({
            map: this.map,
            position: location,
            title: fullAddress,
          });
          console.log('Location geocoded and cached.');
        } else {
          console.error(
            'Geocode was not successful for the following reason: ' + status
          );
        }
      });
    } else {
      console.error('Geocoder or Map not initialized.');
    }
  }

  markDriverLocation(partnerId: string, operatorId: string): void {
    console.log('markDriverLocation called with:', {
      partnerId,
      operatorId,
    });
    this.operatorId = operatorId;

    if (!this.map) {
      console.error('Map is not initialized.');
      return;
    }
    // Start auto-refresh for driver location
    this.startDriverLocationUpdates(partnerId, operatorId);
  }

  private startDriverLocationUpdates(partnerId: string, operatorId: string): void {
    this.stopDriverLocationUpdates(); // Stop any existing intervals
  
    this.locationUpdateInterval = setInterval(() => {
      this.driverLocationService.getDriverLocation(partnerId, operatorId).subscribe(
        (data) => {
          if (data?.latitude && data?.longitude) {
            const newLocation = { latitude: data.latitude, longitude: data.longitude };
  
            // Only update the marker if the driver has moved significantly
            if (!this.lastKnownLocation || this.hasDriverMoved(newLocation)) {
              console.log('Updating Driver Location:', data);
              this.updateDriverMarker(data);
              this.lastKnownLocation = newLocation;
            } else {
              console.log('No significant movement detected. Skipping update.');
            }
          } else {
            console.warn('No valid location data received.');
          }
        },
        (error) => {
          console.error('Error fetching driver location:', error);
        }
      );
    }, 15000); // Fetch every 15 seconds
  }

  private hasDriverMoved(newLocation: { latitude: number; longitude: number }): boolean {
    if (!this.lastKnownLocation) {
      this.lastKnownLocation = newLocation; // Initialize if null
      return true; // Assume driver has "moved" for the first time
    }

    const distance = this.calculateDistance(this.lastKnownLocation, newLocation);
    return distance > 0.05; // Update only if driver moves more than 50 meters
  }
  
  private calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
    const R = 6371; // Radius of Earth in km
    const dLat = (loc2.latitude - loc1.latitude) * (Math.PI / 180);
    const dLon = (loc2.longitude - loc1.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.latitude * (Math.PI / 180)) * Math.cos(loc2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Stop the interval when needed
  private stopDriverLocationUpdates(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  // Throttle geocode requests to 1 request per second
  markLocationThrottled = throttle(this.updateDriverMarker, 1000);

  private updateDriverMarker(location: {
    latitude: number;
    longitude: number;
  }): void {
    if (!this.driverMarker) {
      this.driverMarker = new google.maps.Marker({
        map: this.map,
        position: new google.maps.LatLng(location.latitude, location.longitude),
        icon: {
          url: '/assets/images/taxi.png',
          scaledSize: new google.maps.Size(40, 40),
        },
      });
    } else {
      this.driverMarker.setPosition(
        new google.maps.LatLng(location.latitude, location.longitude)
      );
    }
  }
}
