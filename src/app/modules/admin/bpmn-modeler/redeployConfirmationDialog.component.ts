import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: 'app-redeploy-confirmation-dialog',
    template: `
      <h2 mat-dialog-title>Confirm Redeployment</h2>
      <mat-dialog-content>
        <p>Are you sure you want to redeploy "{{ data.processName }}"?</p>
        <p>This will create a new version of the process.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close(false)">Cancel</button>
        <button mat-raised-button color="primary" (click)="dialogRef.close(true)">Confirm</button>
      </mat-dialog-actions>
    `,
    standalone: true,
    imports: [MatDialogModule, MatButtonModule]
  })
  export class RedeployConfirmationDialogComponent {
    dialogRef = inject(MatDialogRef<RedeployConfirmationDialogComponent>);
    data = inject(MAT_DIALOG_DATA);
  }