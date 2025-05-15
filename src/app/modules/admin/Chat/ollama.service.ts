import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from 'environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class OllamaService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  askOllamaNatural(prompt: string): Observable<string> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http
      .post<{ response?: string; error?: string }>(
        `${this.apiUrl}/natural`,
        { prompt },
        { headers }
      )
      .pipe(
        retry(2),
        map((response) => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.response || 'Oops, Bird’s quiet today!';
        }),
        catchError((err) => {
          console.error('Ollama error:', err.message);
          return throwError(() => new Error('Can’t reach Bird—maybe he’s flying? Try again!'));
        })
      );
  }
}