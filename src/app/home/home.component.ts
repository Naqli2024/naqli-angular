import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OpenGetEstimateComponent } from './open-get-estimate/open-get-estimate.component';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Carousel01Component } from './carousel/carousel01.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, Carousel01Component],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(private modalService: NgbModal, private translateService: TranslateService) {}

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
    return `/home/user/${name.toLowerCase()}`;
  }

  openGetEstimateModal(event: MouseEvent): void {
    event.preventDefault();
    const modalRef = this.modalService.open(OpenGetEstimateComponent, {
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'no-background',
      backdropClass: 'no-background-backdrop',
    });
  }
}
