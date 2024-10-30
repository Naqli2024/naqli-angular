import { Component } from '@angular/core';
import { RegisterComponent } from '../auth/register/register.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './partner.component.html',
  styleUrl: './partner.component.css',
})
export class PartnerComponent {}
