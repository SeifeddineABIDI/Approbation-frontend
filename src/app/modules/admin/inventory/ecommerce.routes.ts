import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { AddUserComponent } from '../user/add-user/add-user.component';
import { InventoryListComponent } from './list/inventory.component';


export default [
    {
        path     : 'list',
        component: InventoryListComponent,
    },

] as Routes;