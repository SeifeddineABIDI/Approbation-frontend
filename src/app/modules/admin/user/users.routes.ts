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
        path: 'modeler/:fileName', // Supports process key/name
        component: BpmnModelerComponent
    },
    {
        path: 'modeler/:fileName/:definitionId', // Optional: Supports specific version
        component: BpmnModelerComponent
    },
] as Routes;
