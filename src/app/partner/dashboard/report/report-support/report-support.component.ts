import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-report-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-support.component.html',
  styleUrl: './report-support.component.css',
})
export class ReportSupportComponent {
  file: File | null = null;

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.file = event.dataTransfer.files[0];
    }
    this.removeDragoverClass(event);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.addDragoverClass(event);
  }

  onDragLeave(event: DragEvent): void {
    this.removeDragoverClass(event);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      this.file = target.files[0];
    }
  }

  private addDragoverClass(event: DragEvent): void {
    (event.target as HTMLElement).classList.add('dragover');
  }

  private removeDragoverClass(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('dragover');
  }
}
