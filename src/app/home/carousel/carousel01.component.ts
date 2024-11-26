import { Component, OnInit } from '@angular/core';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [MdbCarouselModule],
  templateUrl: './carousel01.component.html',
  styleUrl: './carousel.component.css'
})
export class Carousel01Component {
  
}
