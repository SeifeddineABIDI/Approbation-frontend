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
import { catchError, filter, map, Observable, of, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'tasks-list',
    templateUrl: './list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatSidenavModule, RouterOutlet, NgIf, MatButtonModule, MatTooltipModule, MatIconModule, CdkDropList, NgFor, CdkDrag, NgClass, CdkDragPreview, CdkDragHandle, RouterLink, TitleCasePipe, DatePipe],
})
export class TasksListComponent implements OnInit, OnDestroy {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;

    drawerMode: 'side' | 'over';
    selectedTask: Task;
    tags: Tag[];
    tasks: any[] = []; // Initialize to empty array to avoid undefined issues
    tasksCount: any = {
        completed: 0,
        incomplete: 0,
        total: 0,
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _tasksService: TasksService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _userService: UserService,
    ) {}

    ngOnInit(): void {
        
    
        
        const user = JSON.parse(localStorage.getItem('user'));
        const accessToken = localStorage.getItem('accessToken');
        document.addEventListener('click', () => {
            this.fetchTasks(); 
        });
        if (user && user.matricule && accessToken) {
            // Fetch tasks based on role
            const taskObservable = user.role === 'MANAGER'
                ? this._tasksService.getTasksByUser(user.matricule, accessToken)
                : user.role === 'RH'
                ? this._tasksService.getRhTasksByUser(accessToken)
                : of([]); // Fallback for other roles

                taskObservable
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((tasks: Task[]) => {
                    console.log('Tasks received:', tasks);
                    this.tasks = tasks || [];
                    this.updateTaskCounts();
                    this._changeDetectorRef.markForCheck();
                    this.updateNavigationCount(this.tasksCount.total);
                });
            

            this._tasksService.tasksCount$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(count => this.updateNavigationCount(count));
        }

        this._tasksService.tasks$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tasks: Task[]) => {
                console.log('Tasks from tasks$:', tasks);
                this.tasks = tasks || [];
                this.tasks.forEach(task => {
                    this.getUserByMatricule(task.requester).subscribe(user => {
                        task.requesterFullName = `${user.firstName} ${user.lastName}`;
                        this._changeDetectorRef.detectChanges();
                    });
                });
                this.updateTaskCounts();
                this._changeDetectorRef.markForCheck();

                setTimeout(() => {
                    const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');
                    if (mainNavigationComponent) {
                        const mainNavigation = mainNavigationComponent.navigation;
                        const menuItem = this._fuseNavigationService.getItem('apps.tasks', mainNavigation);
                        if (menuItem?.subtitle) {
                            menuItem.subtitle = `${this.tasksCount.incomplete} remaining tasks`;
                        }
                        mainNavigationComponent.refresh();
                    }
                });
            });

        this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((task: Task) => {
                this.selectedTask = task;
                this._changeDetectorRef.markForCheck();
            });

        this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((state) => {
                this.drawerMode = state.matches ? 'side' : 'over';
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
                    menuItem.badge = menuItem.badge || { title: '' };
                    menuItem.badge.title = count.toString();
                    mainNavigationComponent.refresh();
                }
            }
        });
    }
    private fetchTasks(): void {
        const user = JSON.parse(localStorage.getItem('user'));
        const accessToken = localStorage.getItem('accessToken');
    
        if (!user?.matricule || !accessToken) return;
    
        let taskObservable: Observable<Task[]> = of([]);
        if (user.role === 'MANAGER') {
            taskObservable = this._tasksService.getTasksByUser(user.matricule, accessToken);
        } else if (user.role === 'RH') {
            taskObservable = this._tasksService.getRhTasksByUser(accessToken);
        }
    
        taskObservable.pipe(
            takeUntil(this._unsubscribeAll),
            catchError((err) => {
                console.error('❌ Error fetching tasks:', err);
                return of([]); // Return empty array on error
            })
        ).subscribe((tasks: Task[]) => {
            console.log('✅ Tasks received:', tasks);
            this.tasks = tasks ?? []; // Ensure tasks is always an array
            this.updateTaskCounts();
            this._changeDetectorRef.detectChanges(); // Ensure UI updates
        });
    }
    
    private updateTaskCounts(): void {
        this.tasksCount.total = this.tasks.length;
        this.tasksCount.completed = this.tasks.filter(task => task.completed).length;
        this.tasksCount.incomplete = this.tasksCount.total - this.tasksCount.completed;
    }

    selectTask(task: Task): void {
        this.selectedTask = task;
        this._tasksService.setTask(task); // Ensure the service knows the selected task
        this._router.navigate([task.taskId], { relativeTo: this._activatedRoute });
        console.log('MatDrawer:', this.matDrawer);
        this.matDrawer?.open();
        this._changeDetectorRef.markForCheck();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onBackdropClicked(): void {
        this._tasksService.setTask(null); // Reset selected task only
        this.selectedTask = null; // Clear local selected task
        this.matDrawer.close().then(() => {
            this._router.navigate(['./'], { relativeTo: this._activatedRoute });
            this._changeDetectorRef.markForCheck();
        });
    }

    dropped(event: CdkDragDrop<Task[]>): void {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this._tasksService.updateTasksOrders(event.container.data).subscribe();
        this._changeDetectorRef.markForCheck();
    }

    trackByFn(index: number, item: any): any {
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
                return of({ firstName: 'Unknown', lastName: '' });
            })
        );
    }

    isCongéTask(task: Task): boolean {
        return task.taskName === 'Manager' || task.taskName === 'RH';
    }

    isAutorisationTask(task: Task): boolean {
        return task.taskName === 'Demande autorisation';
    }
}