import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class PartnerHelpComponent {
  toggleOpen(faq: any) {
    faq.open = !faq.open;
  }
}
