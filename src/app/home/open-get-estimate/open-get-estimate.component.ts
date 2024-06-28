import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-open-get-estimate',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './open-get-estimate.component.html',
  styleUrl: './open-get-estimate.component.css'
})
export class OpenGetEstimateComponent {
  constructor(public activeModal: NgbActiveModal) {}

  items = [
    {
      image: 'assets/images/vehicle.svg',
      name: 'Vehicle',
    },
    { image: 'assets/images/bus.svg', name: 'Bus' },
    {
      image: 'assets/images/equipment.svg',
      name: 'Equipment',
    },
    {
      image: 'assets/images/special.svg',
      name: 'Special',
    },
    {
      image: 'assets/images/others.svg',
      name: 'Others',
    },
  ];
  getRoute(name: string): string {
    return `/home/user/${name.toLowerCase()}-estimate`;
  }

  dismissModal(): void {
    this.activeModal.dismiss();
  }
}
