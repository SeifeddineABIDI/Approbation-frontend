import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
import { InventoryService } from 'app/modules/admin/inventory/inventory.service';
import { BehaviorSubject, debounceTime, merge, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Task } from '../tasks/tasks.types';

@Component({
    selector       : 'inventory-list',
    templateUrl    : './listUserConfirmed.component.html',
    styleUrls      : ['./listUserConfirmed.component.scss'],
    providers: [DatePipe],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations,
    standalone     : true,
    imports        : [NgIf,MatProgressSpinnerModule,MatTableModule, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgFor, NgTemplateOutlet, MatPaginatorModule, NgClass, MatSlideToggleModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatRippleModule, AsyncPipe, CurrencyPipe],
})
export class RequestsListUserConfirmedComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    roles: string[] = ['ADMIN', 'MANAGER', 'USER','RH'];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: any = { page: 0, size: 10, length: 0 }; // Default pagination
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedProduct: Task[] = [];   
    selectedProcInstId : string = '';
    selectedProductForm: UntypedFormGroup;
    selectedTaskForm: UntypedFormGroup;
    tagsEditMode: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
        displayedColumns: string[] = ['requestDate', 'startDate', 'endDate', 'approved', 'goAfterMidday','backAfterMidday'];
    dataSource = new MatTableDataSource([]);
    private _productsSubject = new BehaviorSubject<any[]>([]);
    products$ = this._productsSubject.asObservable();
    pageSizes: number[] = [10, 25, 50, 100]; // Page size options (you can change these values)

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _inventoryService: InventoryService,
        private userService: UserService,
        private datepipe: DatePipe
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
        // Create the selected product form
        this.selectedProductForm = this._formBuilder.group({
            id               : [''],
            requester: [''],
            requestDate      : [''],
            startDate        : [''],
            endDate          : [''],
            approved            : [''],
   

        });
        var accessToken = localStorage.getItem('accessToken');
        var user = JSON.parse(localStorage.getItem('user') || '{}');
        if (accessToken) {
            // Get the first page of products
            this.getLeaveRequests(user.matricule, accessToken);
          }
        this.searchInputControl.valueChanges.pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(300), // Wait 300ms after the user stops typing
            switchMap((query) => {
                this.isLoading = true;
                this.pagination.page = 0;
                return this.userService.getRequestsConfirmedByUser(user.matricule, accessToken);
            }),
            tap((data) => {
                this.isLoading = false;
            })
        ).subscribe((data) => {
            this.dataSource.data=data;
            this._changeDetectorRef.markForCheck(); // Ensure changes are detected
            this._productsSubject.next(data);
            this._changeDetectorRef.markForCheck(); // Ensure changes are detected
        });



    }   
    // Inside your component
    calculateDaysDifference(startDate: string, endDate: string): string {
        if (!startDate || !endDate) return "0 days";  // return a default string if dates are not valid
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const timeDiff = Math.abs(end.getTime() - start.getTime()) + 1; // Add 1 to include both start and end day
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));  // Convert milliseconds to days
        
        let res = "";
        if (diffDays === 1) {
          res = `${diffDays} day`;  // Singular form
        } else {
          res = `${diffDays} days`; // Plural form
        }
      
        return res;
      }
      
  
   // In your component class
isTaskSelected(procInstId: string): boolean {
    return this.selectedProcInstId === procInstId;
}

toggleDetails(procInstId: string): void {
    if (this.selectedProcInstId === procInstId) {
        // If clicking on the same request, close it
        this.selectedProcInstId = '';
        this.selectedProduct = [];
    } else {
        // If clicking on a different request, fetch its tasks
        this.isLoading = true;
        this.selectedProcInstId = procInstId;
        
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.userService.getTaskByProcessId(procInstId, accessToken).subscribe({
                next: (tasks: any[]) => {
                    this.selectedProduct = tasks;
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error fetching task details:', error);
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }
            });
        }
    }
}
    
getFormattedDate(date: string | Date): string | null {
    return this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:ss'); // Format the date as you want
  }
    getLeaveRequests(matricule : string, accessToken:string): void {
        
        this.userService.getRequestsConfirmedByUser(matricule, accessToken).pipe(
            tap((data) => {}),
            takeUntil(this._unsubscribeAll)
        )
        .subscribe(
            (data) => {
                this._productsSubject.next(data);
                this.dataSource.data = data;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            },
            (error) => {
                console.error('Error fetching leave requests', error);
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            }
        );
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

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
