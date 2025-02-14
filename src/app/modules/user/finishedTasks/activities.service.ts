import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Activity } from './activities.types';
import { environment } from 'environments/environment';
import { Task } from '../requests/tasks/tasks.types';

@Injectable({providedIn: 'root'})
export class ActivitiesService
{    private apiUrl = environment.apiUrl;

    // Private
    private _activities: BehaviorSubject<any> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for activities
     */
    get activities(): Observable<any>
    {
        return this._activities.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get activities
     */
    getActivities(assignee: string, accessToken: string): Observable<any> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        return this._httpClient.get<Task[]>(`${this.apiUrl}/tasks/get/assignee/${assignee}`, { headers }).pipe(
            tap((response: Task[]) => {
                console.log('API Response:', response); // Log the response to the console
                this._activities.next(response);
            }),
        );
    }
    
}
