import { Component } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent {
  isLoading: boolean = false;

  constructor(private spinnerService: SpinnerService) {}

  ngOnInit(): void {
    this.spinnerService.isLoading.subscribe(
      (loading: boolean) => {
        this.isLoading = loading;
      }
    );
  }
}
