import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, AbstractControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { TasksListComponent } from 'app/modules/user/requests/tasks/list/list.component';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import {  Task } from 'app/modules/user/requests/tasks/tasks.types';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { MatRadioModule } from '@angular/material/radio';

@Component({
    selector       : 'tasks-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatRadioModule,RouterModule,FormsModule, ReactiveFormsModule, MatButtonModule, NgIf, MatIconModule, MatMenuModule, MatDividerModule, MatFormFieldModule, MatInputModule, TextFieldModule, NgFor, MatRippleModule, MatCheckboxModule, NgClass, MatDatepickerModule, FuseFindByKeyPipe, DatePipe],
})
export class TasksDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin!: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel!: TemplateRef<any>;
    @ViewChild('titleField') private _titleField!: ElementRef;

    task!: Task;
    taskForm!: UntypedFormGroup;
    requestForm: UntypedFormGroup;
    tasks: Task[] = [];
    tagsEditMode = false;
    private _tagsPanelOverlayRef?: OverlayRef;
    private _unsubscribeAll: Subject<void> = new Subject<void>();
    successMessage: string;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _tasksListComponent: TasksListComponent,
        private _tasksService: TasksService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
    ) {}

    ngOnInit(): void {
        this.requestForm = this._formBuilder.group({
            
            comments: [''],
            approvalStatus: [null, Validators.required]  
        });
        this._activatedRoute.paramMap.subscribe(params => {
            const taskId = params.get('id');
            if (taskId) {
                this._tasksService.getTaskById(taskId).subscribe(task => {
                    this.task = task;
                    this.taskForm.patchValue(task, { emitEvent: false });
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
        
        this._tasksListComponent.matDrawer.open();
        this.taskForm = this._formBuilder.group({
            id: [''], title: [''], notes: [''], completed: [false],
        });

        this._tasksService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(tags => {
                this._changeDetectorRef.markForCheck();
            });

        this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(task => {
                this.task = task;
                this.taskForm.patchValue(task, { emitEvent: false });
                this._changeDetectorRef.markForCheck();
            });

        this.taskForm.valueChanges
            .pipe(debounceTime(300), takeUntil(this._unsubscribeAll))
            .subscribe(value => {
                this._tasksService.updateTask(value.id, value).subscribe();
                this._changeDetectorRef.markForCheck();
            });

        this._router.events
            .pipe(takeUntil(this._unsubscribeAll), filter(event => event instanceof NavigationEnd))
            .subscribe(() => this._titleField.nativeElement.focus());
    }

    ngAfterViewInit(): void {
        this._tasksListComponent.matDrawer.openedChange
            .pipe(takeUntil(this._unsubscribeAll), filter(opened => opened))
            .subscribe(() => this._titleField.nativeElement.focus());
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this._tagsPanelOverlayRef?.dispose();
        this._tasksListComponent.matDrawer.close();
    }

    toggleCompleted(): void {
        const completedControl = this.taskForm.get('completed') as AbstractControl;
        completedControl.setValue(!completedControl.value);
    }

    confirmTask(): void {
        if (this.taskForm.invalid) return; // Stop if form is invalid
    
        const taskId = this.task?.taskId; // Get task ID
        if (!taskId) return; // Ensure task ID is available
    
        const payload = {
            approvalStatus: this.requestForm.value.approvalStatus,
            comments: this.requestForm.value.comments
        };
        console.log("Payload being sent:", payload);

        const accessToken = localStorage.getItem('accessToken'); // Get access token
    
        if (!accessToken) {
            this.successMessage = "Authentication error: Please log in again.";
            return;
        }
    
        this._tasksService.confirmTask(taskId, payload, accessToken).subscribe({
            next: (response: string) => {  // API returns plain text
                this.successMessage = response; // Set response text as success message
                this._changeDetectorRef.detectChanges(); // Trigger UI update
                this.closeDrawer(); // Close drawer
                this.reloadTasks(); // Refresh task list
                this._tasksService.deleteTask(this.task.taskId).subscribe(isDeleted => {
                    if (!isDeleted) return;
                    this._router.navigate(['../'], { relativeTo: this._activatedRoute });
                });
                this._changeDetectorRef.markForCheck();},
            error: (error) => {
                console.error("Error confirming task:", error);
                this.successMessage = "Failed to confirm task. Try again.";
                this._changeDetectorRef.detectChanges(); // Ensure UI updates
            }
        });
    }
    
    
    

    deleteTask(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete task',
            message: 'Are you sure you want to delete this task? This action cannot be undone!',
            actions: { confirm: { label: 'Delete' } },
        });

        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this._tasksService.deleteTask(this.task.taskId).subscribe(isDeleted => {
                    if (!isDeleted) return;
                    this._router.navigate(['../'], { relativeTo: this._activatedRoute });
                });
                this._changeDetectorRef.markForCheck();
            }
        });
    }
        /**
     * Close the drawer
     */
        closeDrawer(): Promise<MatDrawerToggleResult>
        {
            return this._tasksListComponent.matDrawer.close();
        }
      
        
        reloadTasks(): void {
            this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(task => {
                this.task = task;
                this.taskForm.patchValue(task, { emitEvent: false });
                this._changeDetectorRef.markForCheck();
            });
        }
}
