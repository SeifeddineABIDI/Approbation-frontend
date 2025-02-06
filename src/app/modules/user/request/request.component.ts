import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { fuseAnimations } from '@fuse/animations';
import { UserService } from 'app/core/user/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
  selector: 'app-add-user',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  animations   : fuseAnimations,

  imports      : [MatIconModule,MatDialogModule,CommonModule ,NgIf, FuseAlertComponent,MatDividerModule, FormsModule,MatRadioModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,MatSelectModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule],

  templateUrl: './request.component.html',
  styleUrl: './request.component.scss'
})
export class RequestComponent {
  @ViewChild('signUpNgForm') signUpNgForm: NgForm;

  alert: { type: FuseAlertType; message: string } = {
    type: 'success',
    message: ''
  };
  signUpForm: UntypedFormGroup;
  showAlert: boolean = false;
  isSubmitting: boolean = false; // Track submission state
  showManagerSelect = false;
  managers: { fullname: string, matricule: string }[] = [];

  constructor(
    private _authService: AuthService,
    private _userService: UserService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router,
    private _dialog: MatDialog,
    private _fuseConfirmationService: FuseConfirmationService
  ) {}

  ngOnInit(): void {
    
    this.signUpForm = this._formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required],
      managerMatricule: [null],
      avatar: [''],
    });
  }
    imageUrl: string | ArrayBuffer | null = null;
    imageFile: File;
    imageName: string | null = null;  // Add this to hold the image file name
    onFileSelected(event: any) {
      const file: File = event.target.files[0];
    
      if (file) {
        // If a file is selected, store the file and its name
        this.imageFile = file;
        this.imageName = file.name;
        this.signUpForm.patchValue({
          avatar: file
        });
        this.signUpForm.get('avatar')?.markAsTouched();
      } else {
        // If no file is selected (input is cleared), reset the image properties
        this.imageFile = null;
        this.imageName = null;
        this.signUpForm.patchValue({
          avatar: null
        });
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
          confirm: {
            label: 'Yes',
            color: 'primary'
          },
          cancel: {
            label: 'No',
            show: true,
          }
        },
        dismissible: true
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result==='confirmed') {
      this.isSubmitting = true; // Disable further submissions
      this.signUpForm.disable(); // Disable form during submission
      this.showAlert = false; // Hide alert during submission
  
      const { firstname, lastname, email, password, role,managerMatricule, avatar } = this.signUpForm.value;
  
      const formData = new FormData();
      formData.append('firstname', firstname);
      formData.append('lastname', lastname);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      formData.append('managerMatricule', managerMatricule);
  
      if (avatar) {
          formData.append('avatar', avatar);
      }
  
      this._authService.signUp(firstname, lastname, email, password, role,managerMatricule, avatar).subscribe(
          (response) => {
              this.isSubmitting = false; // Reset submission flag
              this.signUpForm.enable(); // Re-enable the form after submission
  
              this.alert = {
                  type: 'success',
                  message: 'User created successfully!'
              };
              this.showAlert = true; // Ensure the alert is displayed
  
              // Delay navigation to show the alert for a few seconds
           
                  this.signUpNgForm.resetForm(); // Reset form after successful submission
                  this.imageName = null; // Reset image name
          },
          (error) => {
              this.isSubmitting = false; // Reset submission flag
              this.signUpForm.enable(); // Re-enable form after error
  
              // Set error message and show alert
              this.alert = {
                  type: 'error',
                  message: 'Something went wrong. Please try again.'
              };
              this.showAlert = true; // Ensure the alert is displayed
          }
      );
        }else{
          return;
        }
  });
}

  onRoleChange(event: any): void {
    const selectedRole = event.value;
    console.log('Selected role:', selectedRole); // Debug log
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
              this.managers = managers; // Populate dropdown options
              console.log('Fetched managers:', this.managers); // Debug log
          },
          (error) => {
              console.error('Error fetching managers:', error); // Handle errors
          }
      );
  } else {
      console.error('Authorization token not found in localStorage');
  }
}


    clearForm(): void {
      // Reset the form to its initial state (empty or default values)
      this.signUpForm.reset(); 
      this.showManagerSelect = false;
      this.signUpForm.get('managerMatricule').clearValidators();
      this.signUpForm.get('managerMatricule').reset();
      // Reset the form to be untouched and pristine
      this.signUpForm.markAsUntouched();
      this.signUpForm.markAsPristine();
    
      // Manually clear all form controls' error states
      Object.keys(this.signUpForm.controls).forEach(controlName => {
        const control = this.signUpForm.get(controlName);
        if (control) {
          control.setErrors(null);  // Clear all errors for the control
        }
      });
    
      // Hide the alert message (if any)
      this.showAlert = false;
    }
}
