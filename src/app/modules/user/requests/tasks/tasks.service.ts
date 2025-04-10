import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Tag, Task } from 'app/modules/user/requests/tasks/tasks.types';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from 'environments/environment';
import { User } from 'app/core/user/user.types';

@Injectable({providedIn: 'root'})
export class TasksService
{
    // Private
    private _tags: BehaviorSubject<Tag[] | null> = new BehaviorSubject(null);
    private _task: BehaviorSubject<Task | null> = new BehaviorSubject(null);
    private _tasks: BehaviorSubject<Task[] | null> = new BehaviorSubject(null);
    private apiUrl = environment.apiUrl;
    private _tasksCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
        const storedCount = localStorage.getItem('tasksCount');
        if (storedCount) {
            this._tasksCount.next(parseInt(storedCount, 10));
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for tags
     */
    get tags$(): Observable<Tag[]>
    {
        return this._tags.asObservable();
    }

    /**
     * Getter for task
     */
    get task$(): Observable<Task>
    {
        return this._task.asObservable();
    }

    /**
     * Getter for tasks
     */
    get tasks$(): Observable<Task[]>
    {
        return this._tasks.asObservable();
    }
   /**
 * Getter for total task count (computed dynamically)
 */
// Add this getter inside your TasksService
get tasksCount$(): Observable<number> {
    return this._tasks.pipe(
        map(tasks => tasks ? tasks.length : 0) 
    );
}
fetchTasks(userMatricule: string): void {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        console.error('No access token found');
        return;
    }

    this._httpClient.get<Task[]>(`${this.apiUrl}/tasks/user/${userMatricule}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${accessToken}`)
    }).pipe(
        tap((tasks: Task[]) => {
            this._tasks.next(tasks);
            this._tasksCount.next(tasks.length);
        })
    ).subscribe({
        error: (err) => console.error('Error fetching tasks:', err)
    });
}



    private updateTasksCount(tasks: Task[]): void {
        this._tasksCount.next(tasks.length); 

    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get tags
     */
    getTags(): Observable<Tag[]>
    {
        return this._httpClient.get<Tag[]>('api/apps/tasks/tags').pipe(
            tap((response: any) =>
            {
                this._tags.next(response);
            }),
        );
    }

    /**
     * Crate tag
     *
     * @param tag
     */
    createTag(tag: Tag): Observable<Tag>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.post<Tag>('api/apps/tasks/tag', {tag}).pipe(
                map((newTag) =>
                {
                    // Update the tags with the new tag
                    this._tags.next([...tags, newTag]);

                    // Return new tag from observable
                    return newTag;
                }),
            )),
        );
    }

    /**
     * Update the tag
     *
     * @param id
     * @param tag
     */
    updateTag(id: string, tag: Tag): Observable<Tag>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.patch<Tag>('api/apps/tasks/tag', {
                id,
                tag,
            }).pipe(
                map((updatedTag) =>
                {
                    // Find the index of the updated tag
                    const index = tags.findIndex(item => item.id === id);

                    // Update the tag
                    tags[index] = updatedTag;

                    // Update the tags
                    this._tags.next(tags);

                    // Return the updated tag
                    return updatedTag;
                }),
            )),
        );
    }
    getTasksByUser(userId: string, accessToken: string): Observable<Task[]> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        return this._httpClient.get<Task[]>(`${this.apiUrl}/tasks/user/${userId}`, { headers }).pipe(
            tap({
                next: (tasks: Task[]) => {
                    this._tasks.next(tasks);
                },
                error: (error) => {
                    console.error('Error fetching tasks:', error);
                }
            })
        );
    }
    getRhTasksByUser(accessToken: string): Observable<Task[]> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        return this._httpClient.get<Task[]>(`${this.apiUrl}/tasks/user/rh`, { headers }).pipe(
            tap((tasks: Task[]) => {
                this._tasks.next(tasks);
            })
        );
    }
    getUsersByMatricule(matricule: string, accessToken: string): Observable<User> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
        
        return this._httpClient.get<User>(`${this.apiUrl}/tasks/getUserByMat/${matricule}`, { headers }).pipe(
            catchError((error) => {
                // Handle error here if needed, e.g., logging or throwing a custom error
                console.error('Error fetching user by matricule:', error);
                return throwError(() => new Error('Failed to fetch user data.'));
            })
        );
    }


    /**
     * Update tasks orders
     *
     * @param tasks
     */
    updateTasksOrders(tasks: Task[]): Observable<Task[]>
    {
        return this._httpClient.patch<Task[]>('api/apps/tasks/order', {tasks});
    }

    /**
     * Search tasks with given query
     *
     * @param query
     */
    searchTasks(query: string): Observable<Task[] | null>
    {
        return this._httpClient.get<Task[] | null>('api/apps/tasks/search', {params: {query}});
    }

    /**
     * Get task by id
     */
    getTaskById(id: string): Observable<Task> {
        return this._tasks.pipe(
            take(1),
            map((tasks) => {
                if (!tasks || !Array.isArray(tasks)) {
                    console.error("Tasks array is null or undefined!");
                    return null;
                }
    
                // Find the task
                const task = tasks.find(item => item.taskId === id) || null;
    
                // Update the task
                this._task.next(task);
    
                return task;
            }),
            switchMap((task) => {
                if (!task) {
                    return throwError(() => new Error(`Could not find task with ID: ${id}!`));
                }
                return of(task);
            }),
        );
    }
    
    setTask(task: Task | null): void {
        this._task.next(task);
    }
    /**
     * Create task
     *
     * @param type
     */
    createTask(type: string): Observable<Task>
    {
        return this.tasks$.pipe(
            take(1),
            switchMap(tasks => this._httpClient.post<Task>('api/apps/tasks/task', {type}).pipe(
                map((newTask) =>
                {
                    const updatedTasks = tasks ? [newTask, ...tasks] : [newTask];
                    // Update the tasks with the new task
                    this._tasks.next([newTask, ...tasks]);

                    // Return the new task
                    return newTask;
                }),
            )),
        );
    }
    confirmTask(taskId: string, payload: any, accessToken: string): Observable<string> {
        const url = `${this.apiUrl}/tasks/confirm/manager/${taskId}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        });
    
        return this._httpClient.post(url, payload, { headers, responseType: 'text' }); // Expect plain text
    }
    confirmRhTask(taskId: string,matricule: string, payload: any, accessToken: string): Observable<string> {
        const url = `${this.apiUrl}/tasks/confirm/rh/${taskId}/${matricule}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        });
    
        return this._httpClient.post(url, payload, { headers, responseType: 'text' }); // Expect plain text
    }
    getTasksForRH(accessToken: string): Observable<Task[]> {
        return this._httpClient.get<Task[]>(`${this.apiUrl}/tasks/user/rh`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
    }
    
    /**
     * Update task
     *
     * @param id
     * @param task
     */
    updateTask(id: string, task: Task): Observable<Task>
    {
        return this.tasks$
            .pipe(
                take(1),
                switchMap(tasks => this._httpClient.patch<Task>('api/apps/tasks/task', {
                    id,
                    task,
                }).pipe(
                    map((updatedTask) =>
                    {
                        // Find the index of the updated task
                        const index = tasks.findIndex(item => item.taskId === id);

                        // Update the task
                        tasks[index] = updatedTask;

                        // Update the tasks
                        this._tasks.next(tasks);

                        // Return the updated task
                        return updatedTask;
                    }),
                    switchMap(updatedTask => this.task$.pipe(
                        take(1),
                        filter(item => item && item.taskId === id),
                        tap(() =>
                        {
                            // Update the task if it's selected
                            this._task.next(updatedTask);

                            // Return the updated task
                            return updatedTask;
                        }),
                    )),
                )),
            );
    }

    /**
     * Delete the task
     *
     * @param id
     */
    deleteTask(id: string): Observable<boolean>
    {
        return this.tasks$.pipe(
            take(1),
            switchMap(tasks => this._httpClient.delete('api/apps/tasks/task', {params: {id}}).pipe(
                map((isDeleted: boolean) =>
                {
                    const updatedTasks = tasks ? tasks.filter(task => task.taskId !== id) : [];

                    // Find the index of the deleted task
                    const index = tasks.findIndex(item => item.taskId === id);

                    // Delete the task
                    tasks.splice(index, 1);

                    // Update the tasks
                    this._tasks.next(tasks);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }
}
