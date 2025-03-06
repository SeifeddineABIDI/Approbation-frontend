import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DatePipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-leave-details-modal',
  templateUrl: './leave-details-modal.component.html',
  styleUrls: ['./leave-details-modal.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule,DatePipe,NgIf]
})
export class LeaveDetailsModalComponent{
  constructor(
    public dialogRef: MatDialogRef<LeaveDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}


  close(): void {
    this.dialogRef.close();
  }
}
