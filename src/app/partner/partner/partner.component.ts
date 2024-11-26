import { Component } from '@angular/core';
import { RegisterComponent } from '../auth/register/register.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, MdbCarouselModule],
  templateUrl: './partner.component.html',
  styleUrl: './partner.component.css',
})
export class PartnerComponent {}
