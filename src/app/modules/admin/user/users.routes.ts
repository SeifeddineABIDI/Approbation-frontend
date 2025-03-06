import { Routes } from '@angular/router';
import { AddUserComponent } from './add-user/add-user.component';
import { UsersComponent } from './users/users.component';
import { BpmnModelerComponent } from '../bpmn-modeler/bpmn-modeler.component';

export default [
    {
        path     : 'list',
        component: UsersComponent,
    },
    {   
        path: 'add',
        component: AddUserComponent 
    },
    {
        path: 'modeler/:fileName', // Changed to dynamic route
        component: BpmnModelerComponent
      },
] as Routes;
