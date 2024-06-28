declare namespace L {
    namespace Routing {
      interface ControlOptions {
        waypoints: LatLng[];
        router?: any;
        createMarker?: (i: number, waypoint: Waypoint, n: number) => Marker;
        lineOptions?: LineOptions;
      }
  
      interface Waypoint {
        latLng: LatLng;
      }
  
      interface LineOptions {
        styles: Array<{ color: string; opacity: number; weight: number }>;
      }
  
      function control(options: ControlOptions): Control;
      function waypoint(latLng: LatLng): Waypoint;
  
      namespace OSRMv1 {
        function create(options?: any): any;
      }
    }
  }