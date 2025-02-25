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
import { Task } from '../inventory.types';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { HttpClient } from '@angular/common/http';

@Component({
    selector       : 'inventory-list',
    templateUrl    : './inventory.component.html',
    styleUrls      : ['./inventory.component.scss'],
    providers: [DatePipe],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations,
    standalone     : true,
    imports        : [NgIf,MatProgressSpinnerModule,MatTableModule,TranslocoModule, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgFor, NgTemplateOutlet, MatPaginatorModule, NgClass, MatSlideToggleModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatRippleModule, AsyncPipe, CurrencyPipe],
})
export class InventoryListComponent implements OnInit, AfterViewInit, OnDestroy
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
        displayedColumns: string[] = ['requeser','matricule','email','manager','requestDate', 'startDate', 'endDate', 'nbDays',, 'goAfterMidday','backAfterMidday', 'toggleDetails'];
    dataSource = new MatTableDataSource([]);
    private _productsSubject = new BehaviorSubject<any[]>([]);
    products$ = this._productsSubject.asObservable();
    pageSizes: number[] = [10, 25, 50, 100];
    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _inventoryService: InventoryService,
        private userService: UserService,
        private datepipe: DatePipe,
        private _httpClient: HttpClient,
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
            procInstId        : [''],
   

        });
        var accessToken = localStorage.getItem('accessToken');

        if (accessToken) {
            // Get the first page of products
            this.getLeaveRequests(this.pagination.page, this.pagination.size, accessToken);
          }
        this.searchInputControl.valueChanges.pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(300), // Wait 300ms after the user stops typing
            switchMap((query) => {
                this.isLoading = true;
                this.pagination.page = 0;
                return this.userService.getLeaveRequests(this.pagination.page, this.pagination.size, query,this._sort.active, this._sort.direction, accessToken);
            }),
            tap((data) => {
                console.log('Data received from API:', data); // Log the data to inspect
                this.isLoading = false;
            })
        ).subscribe((data) => {
            this.dataSource.data=data.content;
            this._changeDetectorRef.markForCheck(); // Ensure changes are detected
            this._productsSubject.next(data.content);
            this.pagination.length = data.totalElements; // Set the total number of elements for pagination
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
    console.log('Toggle Details Called:', {
        procInstId,
        currentSelected: this.selectedProcInstId,
        selectedProduct: this.selectedProduct
    });
    
    if (this.selectedProcInstId === procInstId) {
        // If clicking on the same request, close it
        console.log('Closing details');
        this.selectedProcInstId = '';
        this.selectedProduct = [];
    } else {
        // If clicking on a different request, fetch its tasks
        console.log('Opening details');
        this.isLoading = true;
        this.selectedProcInstId = procInstId;
        
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.userService.getTaskByProcessId(procInstId, accessToken).subscribe({
                next: (tasks: any[]) => {
                    console.log('Tasks received:', tasks);
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
    getLeaveRequests(page: number, size: number, accessToken: string, query?: string, sortField?: string, sortDirection?: string): void {
        
        this.userService.getLeaveRequests(page, size, query, sortField, sortDirection, accessToken).pipe(
            tap((data) => console.log('Data received:', data)),
            takeUntil(this._unsubscribeAll)
        )
        .subscribe(
            (data) => {
                this._productsSubject.next(data.content);
                this.dataSource.data = data.content;
                this.pagination.length = data.totalElements;
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
    

    
    getAvatarUrl(avatarPath: string): string {
        const baseUrl = 'http://localhost:8080/images/';
        const cleanedPath = avatarPath.replace('src\\main\\resources\\static\\images\\', '');
        return baseUrl + cleanedPath;
      }
    /**
     * After view init
     */
    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    const accessToken = localStorage.getItem('accessToken');
                    if (accessToken) {
                        this.getLeaveRequests(
                            this._paginator.pageIndex,
                            this._paginator.pageSize,
                            accessToken,
                            this.searchInputControl.value,
                            this._sort.active,  
                            this._sort.direction
                        );
                    }
                });
    
            this.dataSource.paginator = this._paginator;
            this.dataSource.sort = this._sort;
        }
    }
    
    sortData(event: any): void {
        this.pagination.page = 0; 
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.getLeaveRequests(
                this.pagination.page,
                this.pagination.size,
                accessToken,
                this.searchInputControl.value, 
                event.active, 
                event.direction 
            );
        }
    }
    onPageChange(event: any): void {
        this.pagination.page = event.pageIndex;
        this.pagination.size = event.pageSize;
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.getLeaveRequests(
                this.pagination.page,
                this.pagination.size,
                accessToken,
                this.searchInputControl.value, 
                this._sort.active, 
                this._sort.direction 
            );
        }
    }
   
    
    

    closeDetails(): void
    {
        console.log('Closing details section...'); 
        this.selectedProduct = [];
        this.selectedProductForm.reset(); 
        this._changeDetectorRef.markForCheck();
    }
    onPageSizeChange(event: any): void {
        this.pagination.size = event.pageSize;
        this.pagination.page = 0; 
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.getLeaveRequests(
                this.pagination.page,
                this.pagination.size,
                accessToken,
                this.searchInputControl.value, 
                this._sort.active, 
                this._sort.direction 
            );
        }
    }
    openAvisCongeReport(instanceId) {
    
        console.log(instanceId);
        
        this._httpClient.get(`http://localhost:8080/tasks/generateAvisCongeReport?instanceId=${instanceId}`, { responseType: 'blob' })
          .subscribe((response: Blob) => {
            const fileURL = URL.createObjectURL(response);
    
            window.open(fileURL, '_blank');
          }, error => {
            console.error('Error generating report:', error);
          });
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
