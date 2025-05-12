// src/app/components/analytics-assistant/analytics-assistant.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OllamaService } from 'app/modules/admin/Chat/ollama.service';

@Component({
  selector: 'app-analytics-assistant',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div style="padding: 20px;">
      <h2>Hey, it’s Bird!</h2>
      <div>
        <label>What’s on your mind?</label>
        <textarea [(ngModel)]="prompt" placeholder="Ask about leaves like 'Who’s got the most?' or try SQL like 'SELECT first_name, last_name FROM USER...'. Or just chat about anything!"></textarea>
      </div>
      <button (click)="submitPrompt()">Send</button>
      <div *ngIf="response">
        <h3>Here’s what I got:</h3>
        <pre>{{ response }}</pre>
      </div>
      <div *ngIf="error" style="color: red">{{ error }}</div>
    </div>
  `,
  styles: [`
    textarea { width: 100%; height: 100px; margin-top: 10px; }
    button { margin-top: 10px; }
    pre { white-space: pre-wrap; }
    div { margin-bottom: 10px; }
  `]
})
export class AnalyticsAssistantComponent {
  prompt = '';
  response: string | null = null;
  error: string | null = null;

  constructor(private ollamaService: OllamaService) {}

  submitPrompt() {
    this.error = null;
    this.response = null;

    if (!this.prompt.trim()) {
      this.error = 'Yo, say something!';
      return;
    }

    this.ollamaService.askOllamaNatural(this.prompt).subscribe({
      next: (res) => {
        this.response = res;
      },
      error: (err) => {
        this.error = 'Oof, something’s up: ' + err.message;
      }
    });
  }
}