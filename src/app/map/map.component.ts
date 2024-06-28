import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    const map: L.Map = L.map('map-container').setView([8.7642, 78.1348], 11); // Centered around Thoothukudi (Tuticorin)

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: `http://router.project-osrm.org/route/v1/`,
      }),
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: '#242c81', weight: 7, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 1,
      },
      fitSelectedRoutes: false,
      altLineOptions: {
        styles: [{ color: '#ed6852', weight: 7, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 1,
      },
      show: false,
      routeWhileDragging: true,
      waypoints: [
        L.latLng(8.7642, 78.1348), // Thoothukudi
        L.latLng(9.9252, 78.1198)  // Madurai
      ],
    }).addTo(map);
  }
}