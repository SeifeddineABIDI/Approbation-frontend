import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import { environment } from 'environments/environment';
import { catchError, map, Observable, ReplaySubject, tap, throwError } from 'rxjs';

@Injectable({providedIn: 'root'})
export class UserService
{
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
    private apiUrl = environment.apiUrl;
    private _tasksService: TasksService;
    

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User)
    {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User>
    {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User>
    {
        return this._httpClient.get<User>('api/common/user').pipe(
            tap((user) =>
            {
                this._user.next(user);
            }),
        );
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any>
    {
        return this._httpClient.patch<User>('api/common/user', {user}).pipe(
            map((response) =>
            {
                this._user.next(response);
            }),
        );
    }
    loadUserFromStorage(): void {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData); 
            if (this.user?.matricule) {
                this._tasksService.fetchTasks(this.user.matricule);
            }
        }

        
        
    }
    getAvatar(userId: number, accessToken: string): Observable<Blob> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        return this._httpClient.get(`${this.apiUrl}/api/v1/management/${userId}/image`, {
            headers,
            responseType: 'blob',
        });
    }
    getAllUsers(accessToken: string): Observable<User[]> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        return this._httpClient.get<User[]>(`${this.apiUrl}/api/v1/admin/all`, {
            headers,
        });
    }
    getManagers(token: string): Observable<{ fullname: string, matricule: string }[]> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this._httpClient.get<{ fullname: string, matricule: string }[]>(
            `${this.apiUrl}/api/v1/admin/managers`,
            { headers }
        );
    }
    getUsersById(userId: number, accessToken: string): Observable<User> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        return this._httpClient.get<User>(`${this.apiUrl}/api/v1/admin/getById/${userId}`, {
            headers,
        });
    }
    getUsersByMatricule(matricule: string, accessToken: string): Observable<User> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        
        return this._httpClient.get<User>(`${this.apiUrl}/api/v1/admin/getUserByMat/${matricule}`, { headers }).pipe(
            catchError((error) => {
                // Handle error here if needed, e.g., logging or throwing a custom error
                console.error('Error fetching user by matricule:', error);
                return throwError(() => new Error('Failed to fetch user data.'));
            })
        );
    }
    
    searchUsers(firstName?: string, lastName?: string, email?: string, matricule?: string, accessToken?: string): Observable<User[]> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);

        let params = new HttpParams();
        if (firstName) params = params.set('firstName', firstName);
        if (lastName) params = params.set('lastName', lastName);
        if (email) params = params.set('email', email);
        if (matricule) params = params.set('matricule', matricule);
        return this._httpClient.get<User[]>(`${this.apiUrl}/api/v1/admin/search`, { headers, params });
    }
    updateUser(userId: number, formData: FormData, accessToken: string): Observable<any> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);        
        return this._httpClient.put<any>(`${this.apiUrl}/api/v1/admin/update/${userId}`, formData, { headers });
    }
    deleteUser(userId: number, accessToken: string): Observable<any> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);        
        return this._httpClient.delete<any>(`${this.apiUrl}/api/v1/admin/delete/${userId}`, { headers });
    }
    uploadAvatar(userId: number, formData: FormData): Observable<string> {
        return this._httpClient.post(`${this.apiUrl}/api/v1/management/${userId}/image`, formData, { responseType: 'text' });
    }
    getLeaveRequests(accessToken: string): Observable<User> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        
        return this._httpClient.get<User>(`${this.apiUrl}/api/v1/admin/request/all`, { headers }).pipe(
            catchError((error) => {
                console.error('Error fetching requests', error);
                return throwError(() => new Error('Failed to fetch requests data.'));
            })
        );
    }
  
    addLeaveRequest(userId: string, startDate: string, endDate: string, accessToken: string): Observable<any> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);        
        const payload = {
            userId,
            startDate,
            endDate
        };
    
        return this._httpClient.post(`${this.apiUrl}/api/v1/management/request`, payload, { headers, responseType: 'text' });
    }
    
}
