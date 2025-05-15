import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationService } from './core/navigation/navigation.service';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss'],
    standalone : true,
    imports    : [RouterOutlet],
})
export class AppComponent implements OnInit
{
    taskCount: number;
    /**
     * Constructor
     */
    constructor(private navigationService: NavigationService,
        private _changeDetectorRef: ChangeDetectorRef,

    )
    {
    }

    ngOnInit(): void {

    // Subscribe to task count updates
    // this.navigationService.taskCount$.subscribe((count) => {
    //   this.taskCount = count;
    //   this._changeDetectorRef.markForCheck();
    // });
    }

    
  //   @HostListener('document:click', ['$event'])
  // onClick(event: MouseEvent): void {
  //   this._changeDetectorRef.markForCheck();
  // }
  private updateNavigationBadge() {
    // If needed, trigger any UI updates here, e.g., update a badge or some other element
  }
}
