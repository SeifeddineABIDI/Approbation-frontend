import { Routes } from '@angular/router';
import { AddUserComponent } from './add-user/add-user.component';
import { UsersComponent } from './users/users.component';

export default [
    {
        path     : 'list',
        component: UsersComponent,
    },
    {   
        path: 'add',
        component: AddUserComponent 
    },
] as Routes;
