/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    },
    {
        id   : 'requests',
        title: 'Requests',
        type : 'basic',
        icon : 'heroicons_outline:calendar-days',
        link : '/request/list'
    },
    {
        id   : 'requestAdd',
        title: 'Request congé',
        type : 'basic',
        icon : 'heroicons_outline:calendar',
        link : '/requests/add'
    },
    {
        id   : 'users',
        title: 'Users',
        type : 'collapsable',
        icon : 'heroicons_outline:users',
        link : '/users',
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
        id   : 'navigation-features.badge-style-oval',
        title: 'Demande de congés',
        icon : 'heroicons_outline:tag',
        link : '/requests/list',
        type : 'basic',
        badge: {
            title  : '0',
            classes: 'w-5 h-5 bg-teal-400 text-black rounded-full',
        },
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
