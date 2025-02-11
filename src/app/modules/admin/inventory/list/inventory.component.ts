import { AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
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
import { User } from 'app/core/user/user.types';
import { InventoryService } from 'app/modules/admin/inventory/inventory.service';
import { InventoryBrand, InventoryCategory, InventoryTag, InventoryVendor } from 'app/modules/admin/inventory/inventory.types';
import { BehaviorSubject, debounceTime, merge, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
    selector       : 'inventory-list',
    templateUrl    : './inventory.component.html',
    styleUrls      : ['./inventory.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations,
    standalone     : true,
    imports        : [NgIf,MatTableModule, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgFor, NgTemplateOutlet, MatPaginatorModule, NgClass, MatSlideToggleModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatRippleModule, AsyncPipe, CurrencyPipe],
})
export class InventoryListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    roles: string[] = ['ADMIN', 'MANAGER', 'USER','RH'];
    brands: InventoryBrand[];
    categories: InventoryCategory[];
    filteredTags: InventoryTag[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: any = { page: 0, size: 10, length: 0 }; // Default pagination
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedProduct: User | null = null;
    selectedProductForm: UntypedFormGroup;
    tags: InventoryTag[];
    tagsEditMode: boolean = false;
    vendors: InventoryVendor[];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    user: User;
    displayedColumns: string[] = ['requestDate', 'startDate', 'endDate', 'managerApproved', 'managerApprovalDate', 'managerComments', 'rhApproved', 'rhApprovalDate', 'rhComments'];
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
            requestDate      : [''],
            startDate        : [''],
            endDate          : [''],
            managerApproved  : [''],
            managerComments  : [''],
            managerApprovalDate: [''],
            rhApproved       : [''],
            rhComments       : [''], 
            rhApprovalDate   : [''],

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
    
      getFormattedDate(date: string | null | undefined): string | null {
        if (!date) return null;
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return null;
        return parsedDate.toLocaleDateString('en-US');
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
                            this._sort.active,  // Persist sorting column
                            this._sort.direction // Persist sorting direction
                        );
                    }
                });
    
            // Ensure paginator and sort are linked
            this.dataSource.paginator = this._paginator;
            this.dataSource.sort = this._sort;
        }
    }
    
    sortData(event: any): void {
        this.pagination.page = 0; // Reset to first page on sort change
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.getLeaveRequests(
                this.pagination.page,
                this.pagination.size,
                accessToken,
                this.searchInputControl.value, // Keep search query if exists
                event.active, // Sorting column
                event.direction // Sorting direction
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
                this.searchInputControl.value, // Preserve search query
                this._sort.active, // Preserve sorting column
                this._sort.direction // Preserve sorting direction
            );
        }
    }
    
    onPageSizeChange(event: any): void {
        this.pagination.size = event.pageSize;
        this.pagination.page = 0; // Reset to first page when page size changes
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.getLeaveRequests(
                this.pagination.page,
                this.pagination.size,
                accessToken,
                this.searchInputControl.value, // Preserve search query
                this._sort.active, // Preserve sorting column
                this._sort.direction // Preserve sorting direction
            );
        }
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
