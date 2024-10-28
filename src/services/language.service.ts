import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private languageSubject = new BehaviorSubject<string>('en');
  currentLanguage$ = this.languageSubject.asObservable();

  constructor(private translateService: TranslateService) {
    const savedLanguage = localStorage.getItem('language') || 'en';
    this.translateService.use(savedLanguage);
    this.languageSubject.next(savedLanguage);
  }

  changeLanguage(lang: string) {
    this.translateService.use(lang);
    localStorage.setItem('language', lang);
    this.languageSubject.next(lang);
  }
}