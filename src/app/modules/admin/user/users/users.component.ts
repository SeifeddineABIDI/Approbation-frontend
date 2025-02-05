import { user } from './../../../../mock-api/common/user/data';
import { AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
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
import { InventoryBrand, InventoryCategory, InventoryPagination, InventoryProduct, InventoryTag, InventoryVendor } from 'app/modules/admin/inventory/inventory.types';
import { debounceTime, map, merge, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';

@Component({
    selector       : 'inventory-list',
    templateUrl    : './users.component.html',
    styleUrls      : ['./users.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations,
    standalone     : true,
    imports        : [NgIf, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgFor, NgTemplateOutlet, MatPaginatorModule, NgClass, MatSlideToggleModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatRippleModule, AsyncPipe, CurrencyPipe],
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    products$: Observable<User[]>;
    roles: string[] = ['ADMIN', 'MANAGER', 'USER'];
    brands: InventoryBrand[];
    categories: InventoryCategory[];
    filteredTags: InventoryTag[];
    flashMessage: 'success' | 'error' | null = null;
    flashMessageDelete: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: InventoryPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedProduct: User | null = null;
    selectedProductForm: UntypedFormGroup;
    tags: InventoryTag[];
    tagsEditMode: boolean = false;
    vendors: InventoryVendor[];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    user: User;
    previewUrl: string | null = null;

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

    
    
    

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        
        this.selectedProductForm = this._formBuilder.group({
            id                : [''],
            matricule         : [''],
            firstName         : [''],
            lastName          : [''],
            email             : [''],
            role              : [''],
            soldeConge        : [''],
            managerMatricule  : [''],
            currentImageIndex : [0],
            avatar: [null]
        });

       
        
        this._inventoryService.categories$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: InventoryCategory[]) =>
            {
                
                this.categories = categories;

                
                this._changeDetectorRef.markForCheck();
            });

        
        this._inventoryService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: InventoryPagination) =>
            {
                
                this.pagination = pagination;

                
                this._changeDetectorRef.markForCheck();
            });
            var accessToken = localStorage.getItem('accessToken');
            this.products$ = this.userService.getAllUsers(accessToken);
        
            
          
        

        
        this._inventoryService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tags: InventoryTag[]) =>
            {
                
                this.tags = tags;
                this.filteredTags = tags;

                
                this._changeDetectorRef.markForCheck();
            });

        
        this._inventoryService.vendors$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((vendors: InventoryVendor[]) =>
            {
                
                this.vendors = vendors;

                
                this._changeDetectorRef.markForCheck();
            });

            var accessToken = localStorage.getItem('accessToken');            
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) =>
                {
                    this.closeDetails();
                    this.isLoading = true;
                    if (!query || query.trim() === '') {
                        return this.userService.getAllUsers(accessToken);
                    }
        
                    return this.userService.searchUsers(query, query, query, query,accessToken);
                }),
                map((users) =>
                {
                    this.products$ = of(users); 
                    this.isLoading = false;
                }),
            )
            .subscribe();
    }
onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]; 
    if (file) {
        
        this.selectedProductForm.patchValue({ avatar: file });
        this.selectedProductForm.get('avatar')?.updateValueAndValidity();

        
        const reader = new FileReader();
        reader.onload = () => {
            this.previewUrl = reader.result as string; 
        };
        reader.readAsDataURL(file); 
    }
}
    
    getAvatarUrl(avatarPath: string): string {
        const baseUrl = 'http://localhost:8080/images/';
        const cleanedPath = avatarPath.replace('src\\main\\resources\\static\\images\\', '');
        return baseUrl + cleanedPath;
      }
    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        if ( this._sort && this._paginator )
        {
            
            this._sort.sort({
                id          : 'matricule',
                start       : 'asc',
                disableClear: true,
            });

            
            this._changeDetectorRef.markForCheck();

            
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() =>
                {
                    
                    this._paginator.pageIndex = 0;

                    
                    this.closeDetails();
                });

            
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() =>
                {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._inventoryService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
                }),
                map(() =>
                {
                    this.isLoading = false;
                }),
            ).subscribe();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    
    
    

    /**
     * Toggle product details
     *
     * @param productId
     */
    toggleDetails(productId: string): void
    {
        
        if ( this.selectedProduct && this.selectedProduct.matricule === productId )
        {
            
            this.closeDetails();
            return;
        }
        const accessToken = localStorage.getItem('accessToken');
        
        this.userService.getUsersByMatricule(productId,accessToken)
            .subscribe((product) =>
            {
                
                this.selectedProduct = product;

                
                this.selectedProductForm.patchValue(product);

                
                this._changeDetectorRef.markForCheck();
            });
    }
    updateSelectedProduct() {
        const accessToken = localStorage.getItem('accessToken');
        if (this.selectedProductForm.valid) {
            const formData = new FormData();
            formData.append('firstName', this.selectedProductForm.value.firstName);
            formData.append('lastName', this.selectedProductForm.value.lastName);
            formData.append('email', this.selectedProductForm.value.email);
            formData.append('matricule', this.selectedProductForm.value.matricule);
            formData.append('role', this.selectedProductForm.value.role);
            formData.append('managerMatricule', this.selectedProductForm.value.managerMatricule);
            formData.append('soldeConge',this.selectedProductForm.value.soldeConge)
            if (this.selectedProductForm.value.avatar) {
                formData.append('avatar', this.selectedProductForm.value.avatar);
            }
                formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
              });
              formData.append('formData', new Blob([JSON.stringify(formData)], { type: 'application/json' }));

          this.userService.updateUser(this.selectedProduct.id,formData,accessToken).subscribe({
            next :(response) => {
              this.flashMessage = 'success';
              this.selectedProduct = response;  
              this.selectedProductForm.patchValue(response); 
              
            },
            error : (error) => {
              this.flashMessage = 'error';
            }
         });
        } else {
          this.flashMessage = 'error';
        }   
      }


    closeDetails(): void
    {
        console.log('Closing details section...'); 
        this.selectedProduct = null;
        this.selectedProductForm.reset(); 
        this._changeDetectorRef.markForCheck();
    }
    toggleTagsEditMode(): void
    {
        this.tagsEditMode = !this.tagsEditMode;
    }

    /**
     * Filter tags
     *
     * @param event
     */
    filterTags(event): void
    {
        const value = event.target.value.toLowerCase();
        this.filteredTags = this.tags.filter(tag => tag.title.toLowerCase().includes(value));
    }


 

    /**
     * Update the tag title
     *
     * @param tag
     * @param event
     */
    updateTagTitle(tag: InventoryTag, event): void
    {
        tag.title = event.target.value;
        this._inventoryService.updateTag(tag.id, tag)
            .pipe(debounceTime(300))
            .subscribe();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete the tag
     *
     * @param tag
     */
    deleteTag(tag: InventoryTag): void
    {
        this._inventoryService.deleteTag(tag.id).subscribe();
        this._changeDetectorRef.markForCheck();
    }



    /**
     * Should the create tag button be visible
     *
     * @param inputValue
     */



    /**
     * Delete the selected product using the form data
     */
    deleteSelectedProduct(): void
    {
        const accessToken = localStorage.getItem('accessToken');
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete user',
            message: 'Are you sure you want to remove this user? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        
        confirmation.afterClosed().subscribe((result) =>
        {
            
            if ( result === 'confirmed' )
            {
                
                const product = this.selectedProductForm.getRawValue();

                
                this.userService.deleteUser(product.id,accessToken).subscribe({
                   next: (response) => {
                        console.log('User deleted successfully', response);
                        this.showFlashMessageDelete('success');
                        this.closeDetails();
                        this.removeUserFromTable(product.id);
                    },
                     error: (error) => {
                        console.error('Error deleting user', error);
                        this.showFlashMessageDelete('error');
                      }
             } );
            }
        });
    }
    removeUserFromTable(userId: string): void {
        
        this.products$.pipe(take(1)).subscribe((users) => {
            
            console.log('Before filtering:', users); 

            const updatedUsers = users.filter(user => user.id !== Number.parseInt(userId) );
            console.log('After filtering:', updatedUsers); 

            
            this.products$ = of(updatedUsers);
    
            
            this._changeDetectorRef.markForCheck();
        });
    }
    /**
     * Show flash message
     */
    showFlashMessage(type: 'success' | 'error'): void
    {
        
        this.flashMessage = type;

        
        this._changeDetectorRef.markForCheck();

        
        setTimeout(() =>
        {
            this.flashMessage = null;

            
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }
    showFlashMessageDelete(type: 'success' | 'error'): void
    {
        
        this.flashMessageDelete = type;

        
        this._changeDetectorRef.markForCheck();

        
        setTimeout(() =>
        {
            this.flashMessageDelete = null;

            
            this._changeDetectorRef.markForCheck();
        }, 3000);
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
