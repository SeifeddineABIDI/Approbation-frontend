import { FuseNavigationItem } from '@fuse/components/navigation';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/example/home',
    },
    {
        id   : 'team-calendar',
        title: 'Team Calendar',
        type : 'basic',
        icon : 'heroicons_outline:user-group',
        link : '/example/team-calendar',
        roles: ['ADMIN','MANAGER','RH','USER']
    },
    {
        id   : 'requests',
        title: 'Requests',
        type : 'basic',
        icon : 'heroicons_outline:calendar-days',
        link : '/request/list',
        roles: ['ADMIN'],

    },
    {
        id   : 'modeler',
        title: 'Process Modeller',
        type : 'collapsable',
        icon : 'heroicons_outline:wrench-screwdriver',
        link : '/users/modeler',
        roles: ['ADMIN'],   
        children: []

    },
    {
        id   : 'users',
        title: 'Users',
        type : 'collapsable',
        icon : 'heroicons_outline:users',
        link : '/users',
        roles: ['ADMIN'],   
        children : [
            {
                id   : 'users.list',
                title: 'List',
                type : 'basic',
                icon : 'heroicons_outline:user-group',
                link : '/users/list'
            },
            {
                id   : 'users.add',
                title: 'Add',
                type : 'basic',
                icon : 'heroicons_outline:user-plus',
                link : '/users/add'
            }
        ]
    },
    {
        id   : 'requestAdd',
        title: 'Request congé',
        type : 'basic',
        icon : 'heroicons_outline:calendar',
        link : '/requests/add'
    },
    {
        id   : 'navigation-features.badge-style-oval',
        title: 'Demande de congés',
        icon : 'heroicons_outline:tag',
        link : '/requests/confirmList',
        type : 'basic',
        roles: ['MANAGER', 'RH'],
            badge: {
            title  : '0',
            classes: 'w-5 h-5 bg-teal-400 text-black rounded-full',
        },},
        {
            id   : 'completeedtasks',
            title: 'Completed Tasks',
            icon : 'heroicons_outline:check-badge',
            link : '/requests/tasksLog',
            type : 'basic',
            roles: ['MANAGER', 'RH'],
            
        },
        {
            id   : 'allRequestsUser',
            title: 'My requests',
            icon : 'heroicons_outline:document-text',
            link : '/requests/all',
            type : 'basic',
            roles: ['ADMIN','MANAGER','RH','USER'],
        },
        {
            id   : 'allRequestsConfirmedUser',
            title: 'My vacations',
            icon : 'heroicons_outline:map',
            link : '/requests/allConfirmed',
            type : 'basic',
            roles: ['ADMIN','MANAGER','RH','USER'],
        },
   
];

export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
