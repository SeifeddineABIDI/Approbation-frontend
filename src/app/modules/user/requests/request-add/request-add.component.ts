import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core'; // Required for datepicker
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { fuseAnimations } from '@fuse/animations';
import { UserService } from 'app/core/user/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'app/core/user/user.types';
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
@Component({
  selector: 'app-add-user',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  animations   : fuseAnimations,

  imports      : [TranslocoModule,NgxMatDatetimePickerModule,MatNativeDateModule, MatDatepickerModule,MatIconModule,MatDialogModule,CommonModule ,NgIf, FuseAlertComponent,MatDividerModule, FormsModule,MatRadioModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,MatSelectModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule],

  templateUrl: './request-add.component.html',
  styleUrl: './request-add.component.scss'
})
export class RequestAddComponent {
  @ViewChild('signUpNgForm') signUpNgForm: NgForm;
  @ViewChild('autorisNgForm') autorisNgForm: NgForm;

  alert: { type: FuseAlertType; message: string } = {
    type: 'success',
    message: ''
  };
  signUpForm: UntypedFormGroup;
  autorisForm: UntypedFormGroup;

  showAlert: boolean = false;
  isSubmitting: boolean = false; 
  showManagerSelect = false;
  managers: { fullname: string, matricule: string }[] = [];
  user: User;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isDepartureAfterMiddayChecked: boolean = false;
  isReturnAfterMiddayChecked: boolean = false;
  formFieldHelpers: string[] = [''];
  selectedType: string | null = null;
    constructor(
    private _userService: UserService,
    private _formBuilder: UntypedFormBuilder,
    private _dialog: MatDialog,
    private _fuseConfirmationService: FuseConfirmationService,
    private _changeDetectorRef: ChangeDetectorRef,
    private TranslocoService: TranslocoService,

  ) {}

  ngOnInit(): void {
    this.signUpForm = this._formBuilder.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      goAfterMidday: [''],
      backAfterMidday: [''],
      
      
    });
    this.autorisForm = this._formBuilder.group({
      date: ['', Validators.required], // Date part
      startTime: ['', Validators.required], // Time part
      endTime: ['', Validators.required]    // Time part
      
      
    });
  }
  toggleDepartureChecked(): void {
    if (this.isDepartureAfterMiddayChecked) {
      this.isReturnAfterMiddayChecked = false; 
    }
  }

  toggleReturnChecked(): void {
    if (this.isReturnAfterMiddayChecked) {
      this.isDepartureAfterMiddayChecked = false; 
    }
  }
  signUp(): void {
    if (this.signUpForm.invalid || this.isSubmitting) {
        return;
    }

    const dialogRef = this._fuseConfirmationService.open({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
        icon: {
            name: 'heroicons_outline:exclamation-circle',
            color: 'warn'
        },
        actions: {
            confirm: { label: 'Yes', color: 'primary' },
            cancel: { label: 'No', show: true }
        },
        dismissible: true
    });

    dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirmed') {
            this.isSubmitting = true;
            this.signUpForm.disable();
            this.showAlert = false;
            const startDate = this.signUpForm.value.startDate ? new Date(this.signUpForm.value.startDate).toISOString().split('T')[0] : null;
            const endDate = this.signUpForm.value.endDate ? new Date(this.signUpForm.value.endDate).toISOString().split('T')[0] : null;
            const goAfterMidday=this.signUpForm.value.goAfterMidday;
            const backAfterMidday=this.signUpForm.value.backAfterMidday;
            const accessToken = localStorage.getItem('accessToken');
            const userData = localStorage.getItem('user');
            if (userData) {
                this.user = JSON.parse(userData);
            }
            this._userService.addLeaveRequest(this.user.matricule, startDate, endDate,goAfterMidday,backAfterMidday, accessToken).subscribe(
                (response) => {
                    this.isSubmitting = false;
                    this.signUpForm.enable();
                    this.alert = {
                        type: 'success',
                        message: response
                    };
                    this.showAlert = true;
                    this.signUpNgForm.resetForm();
                },
                (error) => {
                    console.error('API Error:', error);

                    this.isSubmitting = false;
                    this.signUpForm.enable();
                    this.alert = {
                        type: 'error',
                        message: error.error?.message || 'Something went wrong. Please try again.'
                    };
                    this.showAlert = true;
                }
            );
        }
    });
}

authorize(): void {
  if (this.autorisForm.invalid || this.isSubmitting) {
      return;
  }

  const dialogRef = this._fuseConfirmationService.open({
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      icon: {
          name: 'heroicons_outline:exclamation-circle',
          color: 'warn'
      },
      actions: {
          confirm: { label: 'Yes', color: 'primary' },
          cancel: { label: 'No', show: true }
      },
      dismissible: true
  });

  dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirmed') {
          this.isSubmitting = true;
          this.autorisForm.disable();
          this.showAlert = false;

          // Get form values
          const selectedDate = new Date(this.autorisForm.value.date);
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const date = `${year}-${month}-${day}`;
          const startTime = this.autorisForm.value.startTime;
          const endTime = this.autorisForm.value.endTime;

          const startDateTime = `${date}T${startTime}:00`;
          const endDateTime = `${date}T${endTime}:00`;
          const userData = localStorage.getItem('user');
          
          if (userData) {
              this.user = JSON.parse(userData);
          }
          const accessToken = localStorage.getItem('accessToken');          
          this._userService.addAuthorizationRequest(this.user.matricule,startDateTime,endDateTime, accessToken).subscribe(
              (response) => {
                  this.isSubmitting = false;
                  this.autorisForm.enable();
                  this.alert = {
                      type: 'success',
                      message: response
                  };
                  this.showAlert = true;
                  this.autorisNgForm.resetForm();
              },
              (error) => {
                  console.error('API Error:', error);
                  this.isSubmitting = false;
                  this.autorisForm.enable();
                  this.alert = {
                      type: 'error',
                      message: error.error?.message || 'Something went wrong. Please try again.'
                  };
                  this.showAlert = true;
              }
          );
      }
  });
}
  onRoleChange(event: any): void {
    const selectedRole = event.value;
    
    if (selectedRole === 'MANAGER' || selectedRole === 'USER') {
        this.showManagerSelect = true;
        this.fetchManagers();
        this.signUpForm.get('managerMatricule').setValidators(Validators.required);
    } else {
        this.showManagerSelect = false;
        this.signUpForm.get('managerMatricule').clearValidators();
        this.signUpForm.get('managerMatricule').reset();
    }
    this.signUpForm.get('managerMatricule').updateValueAndValidity();
}
fetchManagers(): void {
  const token = localStorage.getItem('accessToken'); 

  if (token) {
      this._userService.getManagers(token).subscribe(
          (managers) => {
              this.managers = managers; 
              
          },
          (error) => {
              console.error('Error fetching managers:', error); 
          }
      );
  } else {
      console.error('Authorization token not found in localStorage');
  }
}


    clearForm(): void {
      
      this.signUpForm.reset(); 
      this.showManagerSelect = false;
      this.signUpForm.get('managerMatricule').clearValidators();
      this.signUpForm.get('managerMatricule').reset();
      this.autorisForm.reset();
      this.signUpForm.markAsUntouched();
      this.signUpForm.markAsPristine();
      this.autorisForm.markAsUntouched();
      this.autorisForm.markAsPristine();
      this._changeDetectorRef.markForCheck();
    
      Object.keys(this.signUpForm.controls).forEach(controlName => {
        const control = this.signUpForm.get(controlName);
        if (control) {
          control.setErrors(null);  
        }
      });
    
      
      this.showAlert = false;
    }

}
