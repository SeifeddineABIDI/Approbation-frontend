import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import {environment} from "../../../environments/environment";

@Injectable({providedIn: 'root'})
export class AuthService
{
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    apiUrl = environment.apiUrl
    private _avatarUrl: BehaviorSubject<string> = new BehaviorSubject<string>(localStorage.getItem('avatarUrl') || '');

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }
    get avatarUrl$(): Observable<string> {
        return this._avatarUrl.asObservable();
    }

    // Function to update avatar URL
    setAvatarUrl(url: string): void {
        localStorage.setItem('avatarUrl', url);
        this._avatarUrl.next(url); // Emit new value
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post(`${this.apiUrl}/api/v1/auth/forgot-password`, {email});
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(token: string, email: string, newPassword: string): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/api/v1/auth/reset-password`, {
            token,
            email,
            newPassword
        });
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any>
    {
        // Throw error, if the user is already logged in
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post(`${this.apiUrl}/api/v1/auth/authenticate`, credentials,{
            withCredentials: true,
        }).pipe(
            switchMap((response: any) =>
            {

                if (response.accessToken) {
                    this.accessToken = response.accessToken;
                    this._authenticated = true;
                    this._userService.user = response.user;
                    localStorage.setItem('user', JSON.stringify(response.user));

                    return of(response);
                } else {
                    throw new Error('Access token is missing in the response.');
                }
            }),
            catchError((error) => {
                console.error('Login failed:', error);
                return throwError(() => new Error('Login failed. Please check your credentials.'));
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any>
    {
        // Sign in using the token
        return this._httpClient.post(`${this.apiUrl}/api/v1/auth/refresh-token`,{}, {
            withCredentials: true,
            
        }).pipe(
            catchError(() =>

                // Return false
                of(false),
            ),
            switchMap((response: any) =>
            {
                // Replace the access token with the new one if it's available on
                // the response object.
                //
                // This is an added optional step for better security. Once you sign
                // in using the token, you should generate a new one on the server
                // side and attach it to the response object. Then the following
                // piece of code can replace the token with the refreshed one.
                if ( response.accessToken )
                {
                    this.accessToken = response.accessToken;
                }

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

                // Return true
                return of(true);
            }),
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {   
        localStorage.clear();
        this._authenticated = false;
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(firstname: string, lastname: string, email: string, password: string, role: string, managerMatricule: string | null = null, avatar: File): Observable<any> {
        const formData = new FormData();
        formData.append('firstname', firstname);
        formData.append('lastname', lastname);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        formData.append('avatar', avatar);
        if (managerMatricule) {
            formData.append('managerMatricule', managerMatricule); 
        }
        // Log the formData content to ensure it's being populated
        formData.forEach((value, key) => {
            console.log(key, value);
        });
    
        return this._httpClient.post(`${environment.apiUrl}/api/v1/auth/register`, formData)
            .pipe(
                catchError((error) => {
                    console.error('Signup failed:', error);
                    return throwError(() => new Error('Signup failed. Please check your credentials.'));
                })
            );
    }
    

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean>
    {
        // Check if the user is logged in
        if ( this._authenticated )
        {
            return of(true);
        }

        // Check the access token availability
        if ( !this.accessToken )
        {
            return of(false);
        }

        // Check the access token expire date
        if ( AuthUtils.isTokenExpired(this.accessToken) )
        {
            return of(false);
        }
        const decodedToken = AuthUtils['_decodeToken'](this.accessToken);
        if (!decodedToken) {
            console.error('Failed to decode the JWT token.');
            return of(false);
        }
        const tokenIp = decodedToken.ip || '';
        const tokenAgent = decodedToken.agent || '';

        const actualAgent = navigator.userAgent;
        /*console.log('Decoded Token (Interceptor):', decodedToken);
        console.log('Token IP (Interceptor):', tokenIp);
        console.log('Token Agent (Interceptor):', tokenAgent);
        console.log('Actual Agent (Interceptor):', actualAgent);*/
        /*if (tokenIp !== '127.0.0.1' && tokenAgent !== actualAgent) {
            console.warn('IP or User-Agent mismatch!');
            this.signOut(); // Log out the user
            return of(false);
        }*/
        return this.signInUsingToken();
    }
   validateResetToken(token: string) {
    console.log('Calling API with token:', token);
    return this._httpClient.get(`${this.apiUrl}/api/v1/auth/validate-reset-token?token=${token}`, { responseType: 'text' })
        .pipe(
            tap(response => console.log('API Response:', response)),
            catchError(error => {
                console.error('API Error:', error);
                return throwError(error);
            })
        );
}

}
