import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPreview, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe, DOCUMENT, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { UserService } from 'app/core/user/user.service';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import { Tag, Task } from 'app/modules/user/requests/tasks/tasks.types';
import { catchError, filter, fromEvent, map, Observable, of, Subject, takeUntil } from 'rxjs';

@Component({
    selector       : 'tasks-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatSidenavModule, RouterOutlet, NgIf, MatButtonModule, MatTooltipModule, MatIconModule, CdkDropList, NgFor, CdkDrag, NgClass, CdkDragPreview, CdkDragHandle, RouterLink, TitleCasePipe, DatePipe],
})
export class TasksListComponent implements OnInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    drawerMode: 'side' | 'over';
    selectedTask: Task;
    tags: Tag[];
    tasks: any[];
    tasksCount: any = {
        completed : 0,
        incomplete: 0,
        total     : 0,
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _tasksService: TasksService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _userService: UserService,
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
        const user = JSON.parse(localStorage.getItem('user')); // Assuming user is stored in localStorage
        const accessToken = localStorage.getItem('accessToken'); // Get access token

        if (user && user.matricule && accessToken) {
            // Get the tasks for the logged-in user
            this._tasksService.getTasksByUser(user.matricule, accessToken)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((tasks: Task[]) => {
                    this.tasks = tasks;

                    // Update the counts
                    this.tasksCount.total = tasks.length;
                    this.tasksCount.incomplete = this.tasksCount.total - this.tasksCount.completed;

                    // Mark for check
                    this._changeDetectorRef.markForCheck();

                    // Update the count on the navigation
                    this.updateNavigationCount(this.tasksCount.total);
                });
                this._tasksService.tasksCount$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(count => {
                    this.updateNavigationCount(count);
                });
        }
        
        // Get the tasks
        this._tasksService.tasks$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tasks: Task[]) =>
            {
                this.tasks = tasks;
                this.tasks.forEach(task => {
                    this.getUserByMatricule(task.requester).subscribe(user => {
                        task.requesterFullName = `${user.firstName} ${user.lastName}`;
                        this._changeDetectorRef.detectChanges()
                    });
                });
                // Update the counts
                this.tasksCount.total = this.tasks.filter(task => task.type === 'task').length;
                this.tasksCount.completed = this.tasks.filter(task => task.type === 'task' && task.completed).length;
                this.tasksCount.incomplete = this.tasksCount.total - this.tasksCount.completed;

                // Mark for check
                this._changeDetectorRef.markForCheck();

                // Update the count on the navigation
                setTimeout(() =>
                {
                    // Get the component -> navigation data -> item
                    const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

                    // If the main navigation component exists...
                    if ( mainNavigationComponent )
                    {
                        const mainNavigation = mainNavigationComponent.navigation;
                        const menuItem = this._fuseNavigationService.getItem('apps.tasks', mainNavigation);

                        // Update the subtitle of the item
                        menuItem.subtitle = this.tasksCount.incomplete + ' remaining tasks';

                        // Refresh the navigation
                        mainNavigationComponent.refresh();
                    }
                });
            });

        // Get the task
        this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((task: Task) =>
            {

                this.selectedTask = task;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to media query change
        this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((state) =>
            {
                // Calculate the drawer mode
                this.drawerMode = state.matches ? 'side' : 'over';

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }
    private updateNavigationCount(count: number): void {
        setTimeout(() => {
            const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');
            if (mainNavigationComponent) {
                const mainNavigation = mainNavigationComponent.navigation;
                const menuItem = this._fuseNavigationService.getItem('navigation-features.badge-style-oval', mainNavigation);
                if (menuItem) {
                    menuItem.badge.title = count.toString();
                    mainNavigationComponent.refresh();
                }
            }
        });
    }

    
    
    selectTask(task: Task): void {
        // Set the selected task
        this.selectedTask = task;
    
        // Navigate to the task details view
        this._router.navigate([task.taskId], { relativeTo: this._activatedRoute });
        console.log('MatDrawer:', this.matDrawer);

        // Open the drawer
        this.matDrawer?.open();
    
        // Mark for UI update
        this._changeDetectorRef.markForCheck();
    }
    
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void {
        // Reset selected task in the service
        this._tasksService.setTask(null);
    
        // Close the drawer
        this.matDrawer.close().then(() => {
            // Navigate back to the list
            this._router.navigate(['./'], { relativeTo: this._activatedRoute });
    
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }
    

    /**
     * Task dropped
     *
     * @param event
     */
    dropped(event: CdkDragDrop<Task[]>): void
    {
        // Move the item in the array
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

        // Save the new order
        this._tasksService.updateTasksOrders(event.container.data).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.taskId || index;
    }
    getUserByMatricule(matricule: string): Observable<{ firstName: string; lastName: string }> {
        const accessToken = localStorage.getItem('accessToken');
        
        return this._tasksService.getUsersByMatricule(matricule, accessToken).pipe(
            map((data) => {
                if (!data) {
                    console.error(`No user found for matricule: ${matricule}`);
                    return { firstName: 'Unknown', lastName: '' };
                }
                return { firstName: data.firstName, lastName: data.lastName };
            }),
            catchError(error => {
                console.error(`Error fetching user for matricule ${matricule}:`, error);
                return of({ firstName: 'Unknown', lastName: '' }); // Return a fallback value
            })
        );
    }
    
    
    
}
