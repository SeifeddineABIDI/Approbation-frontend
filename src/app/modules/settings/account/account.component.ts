import { TextFieldModule } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector       : 'settings-account',
    templateUrl    : './account.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, TextFieldModule, MatSelectModule, MatOptionModule, MatButtonModule],
})
export class SettingsAccountComponent implements OnInit
{
    accountForm: UntypedFormGroup;
    user: User;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    avatarUrl: any;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _userService: UserService,
        private _cdr: ChangeDetectorRef,
        private _authService : AuthService
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
        // Create the form
        this.accountForm = this._formBuilder.group({
            firstName    : [''],
            lastName: [''],
            matricule: [{ value: '', disabled: true }], // Correct way to disable
            managerMatricule :  [{ value: '', disabled: true }],
            email   :[{ value: '', disabled: true }],
            soldeConge :  [{ value: '', disabled: true }]
        });
        this._userService.user$.subscribe(user=>{
            this.accountForm.patchValue({
              firstName: user.firstName,
              lastName: user.lastName,
              matricule: user.matricule ,
              managerMatricule: user.manager?.matricule || '', 
              email: user.email,
              soldeConge: user.soldeConge,
            });
            });
            this._initializeUser();
            if(this.user.id){
            this._initializeAvatar();
            }
    }
      /**
     * Fetch user avatar from the backend
     */
      private _fetchUserAvatar(): void {
        const accessToken = localStorage.getItem('accessToken');
        if (this.user && this.user.id && accessToken) {
            this._userService.getAvatar(this.user.id, accessToken)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(
                    (blob) => {
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                            this.avatarUrl = event.target.result;
                            localStorage.setItem('avatarUrl', this.avatarUrl); // Cache avatar
                        };
                        reader.readAsDataURL(blob);
                    },
                    (error) => {
                        console.error('Error fetching avatar:', error);
                        this.avatarUrl = null; // Set fallback (e.g., default avatar image)
                    }
                );
        }
    }
    private _initializeUser(): void {
        // Fetch user data from local storage
        this._userService.loadUserFromStorage();

        // Subscribe to user updates from the UserService
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user; // Update user on data change
            });
    }
    private _initializeAvatar(): void {
        // Check for cached avatar in local storage
        const cachedAvatarUrl = localStorage.getItem('avatarUrl');
        if (cachedAvatarUrl) {
            this.avatarUrl = cachedAvatarUrl;
        } else {
            this._fetchUserAvatar();
        }}
    /**
     * Handle file selection, preview it, and upload automatically
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
    
            // Instant preview of the selected image
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.avatarUrl = e.target.result; // Update the image preview immediately
                this._cdr.detectChanges(); // Force change detection to update UI
            };
            reader.readAsDataURL(file);
    
            // Upload the image
            this.uploadImage(file);
        }
    }

    /**
     * Upload profile image to backend and update avatar
     */
    uploadImage(file: File): void {
        const formData = new FormData();
        formData.append('avatar', file);

        this._userService.uploadAvatar(this.user.id, formData).subscribe(
            (response) => {
                this._fetchUserAvatar();
                this._cdr.detectChanges(); 
                this._authService.setAvatarUrl(this.avatarUrl);

            },
            (error) => console.error('Upload failed:', error)
        );
    }
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    
}
