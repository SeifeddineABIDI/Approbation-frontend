import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";


@Component({
    selector: 'app-delete-confirmation-dialog',
    template: `
      <h2 mat-dialog-title>Confirm Deletion</h2>
      <mat-dialog-content>
        <p>Are you sure you want to delete version "{{ data.versionId }}" of "{{ data.processName }}"?</p>
        <p>This action cannot be undone.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close(false)">Cancel</button>
        <button mat-raised-button color="warn" (click)="dialogRef.close(true)">Delete</button>
      </mat-dialog-actions>
    `,
    standalone: true,
    imports: [MatDialogModule, MatButtonModule]
  })
  export class DeleteConfirmationDialogComponent {
    dialogRef = inject(MatDialogRef<DeleteConfirmationDialogComponent>);
    data = inject(MAT_DIALOG_DATA);
  }