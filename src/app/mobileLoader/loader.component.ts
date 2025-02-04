import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent implements OnInit {
  ngOnInit(): void {
    setTimeout(() => {
      console.log('Posting message: NavigateToFlutter');
      window.parent.postMessage('NavigateToFlutter', '*');

      if ((window as any).NavigateToFlutter) {
        (window as any).NavigateToFlutter.postMessage('NavigateToFlutter');
      }
    }, 3000);
  }
}
