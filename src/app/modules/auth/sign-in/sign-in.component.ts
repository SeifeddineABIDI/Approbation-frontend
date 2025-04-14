import { NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from 'environments/environment';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module, ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
    selector     : 'auth-sign-in',
    templateUrl  : './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [RouterLink, FuseAlertComponent, NgIf, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule,
                    RecaptchaV3Module
    ],
    providers: [
        ReCaptchaV3Service,
        {
          provide: RECAPTCHA_V3_SITE_KEY,
          useValue: environment.recaptcha.siteKey,
        },
      ],

})
export class AuthSignInComponent implements OnInit
{
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private recaptchaV3Service: ReCaptchaV3Service
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
            this._activatedRoute.queryParams.subscribe(params => {
        if (params['message']) {
            this.alert = {
                type: 'success',
                message: params['message']
            };
            this.showAlert = true; // Show the alert
        }
    });
        // Create the form
        this.signInForm = this._formBuilder.group({
            email     : ['hughes.brian@company.com', [Validators.required, Validators.email]],
            password  : ['admin', Validators.required],
            rememberMe: [false],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
   signIn(): void {
    if (this.signInForm.invalid) {
        return;
    }
    this.signInForm.disable();
    this.showAlert = false;

    console.log('Executing reCAPTCHA v3...');
    this.recaptchaV3Service.execute('login').subscribe(
        (token: string) => {
            console.log('reCAPTCHA Token:', token);
            this._authService
                .signIn({ ...this.signInForm.value, recaptchaToken: token })
                .subscribe(
                    () => {
                        if (this.signInForm.value.rememberMe) {
                            this._authService.signInUsingToken().subscribe(() => {});
                        }
                        const redirectURL =
                            this._activatedRoute.snapshot.queryParamMap.get('redirectURL') ||
                            '/signed-in-redirect';
                        this._router.navigateByUrl(redirectURL);
                    },
                    (response) => {
                        this.signInForm.enable();
                        this.signInNgForm.resetForm();
                        this.alert = {
                            type: 'error',
                            message: response.error?.message || 'Authentication failed',
                        };
                        this.showAlert = true;
                        console.error('Auth Error:', response);
                    }
                );
        },
        (error) => {
            this.signInForm.enable();
            this.alert = {
                type: 'error',
                message: 'reCAPTCHA verification failed. Please try again.',
            };
            this.showAlert = true;
            console.error('reCAPTCHA Execution Error:', error);
        }
    );
}
    
}
