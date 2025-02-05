import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'app-confirm-dialog',
    template: `
<h1 mat-dialog-title>
  <span class="dialog-title">{{ data.title }}</span>
</h1>

<div mat-dialog-content class="dialog-content">
  <p>{{ data.message }}</p>
</div>

<div mat-dialog-actions class="dialog-actions">
  <button mat-stroked-button (click)="onCancel()">Cancel</button>
  <button mat-flat-button color="primary" (click)="onConfirm()">Confirm</button>
</div>

    `,
    imports: [MatDialogModule,MatIconModule],
    standalone: true,
    styleUrl: './confirm-dialog.component.scss',

  })
  export class ConfirmDialogComponent {
    constructor(
      public dialogRef: MatDialogRef<ConfirmDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
    ) {}
  
    onCancel(): void {
      this.dialogRef.close(false);
      
    }
  
    onConfirm(): void {
      this.dialogRef.close(true);
    }
  }
  