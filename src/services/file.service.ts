import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private baseUrl = 'https://naqlee.com/api/files'; 
  
  constructor(private http: HttpClient) {}

  // Function to get the file URL
  getFileUrl(fileName: string): string {
    return `${this.baseUrl}/${fileName}`;
  }
}