import { NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector     : 'auth-reset-password',
    templateUrl  : './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [NgIf, FuseAlertComponent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
})
export class AuthResetPasswordComponent implements OnInit
{
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    resetPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    isValidToken: boolean = false;
    token: string;
    isLoading: boolean = true;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _route: ActivatedRoute,

    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.token = this._route.snapshot.queryParams['token'];

        // Validate the token
        this.isLoading = true; 
        this.isValidToken = false;
        this._authService.validateResetToken(this.token).subscribe(
            () => {
                this.isValidToken = true;
                this.isLoading = false;
            },
            (error) => {
                console.error('Token validation failed:', error);
                this._router.navigate(['/404']);
            }
        );
        // Create the form
        this.resetPasswordForm = this._formBuilder.group({
                email          : ['', [Validators.required, Validators.email]],
                password       : ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch('password', 'passwordConfirm'),
            },
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Reset password
     */
    resetPassword(): void {
        if (this.resetPasswordForm.invalid) {
            return;
        }
    
        this.resetPasswordForm.disable();
        this.showAlert = false;
    
        const email = this.resetPasswordForm.get('email').value;
        const password = this.resetPasswordForm.get('password').value;
    
        this._authService.resetPassword(this.token, email, password)
        .pipe(
            finalize(() => {
                this.resetPasswordForm.enable();
                this.resetPasswordNgForm.resetForm();
            })
        )
        .subscribe(
            (response) => {    
                if (response && response.message) {
                    this._router.navigate(['/sign-in'], { 
                        queryParams: { message: response.message } 
                    });
                } else {
                    console.warn("Unexpected response structure:", response);
                    this.alert = {
                        type: 'error',
                        message: 'Unexpected response from server.',
                    };
                    this.showAlert = true;
                }
            },
            (error) => {
                console.error("Error resetting password:", error);
    
                this.alert = {
                    type: 'error',
                    message: error?.error?.error || 'Something went wrong, please try again.',
                };
                this.showAlert = true;
            }
        );    
    }    
    
}
