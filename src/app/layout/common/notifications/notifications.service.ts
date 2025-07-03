import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Notification } from 'app/layout/common/notifications/notifications.types';
import { map, Observable, ReplaySubject, switchMap, take, tap, Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { environment } from 'environments/environment';
import { UserService } from 'app/core/user/user.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    private _notifications: ReplaySubject<Notification[]> = new ReplaySubject<Notification[]>(1);
    private stompClient: Client;
    private apiUrl = environment.apiUrl;
    public taskUpdate$ = new Subject<void>();

    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService
    ) {
        this._connectWebSocket();
    }

    get notifications$(): Observable<Notification[]> {
        return this._notifications.asObservable();
    }

    private _connectWebSocket(): void {
        const socket = new SockJS(`${this.apiUrl}/notifications`);
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
        });

        this.stompClient.onConnect = () => {
            const userId = this._userService.getCurrentUserId();
            this.stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
                const data = JSON.parse(message.body);
                this._updateNotifications(data);
            }, { id: 'notification-subscription' }); // Add subscription ID for management
            this.getAll().subscribe(); // Initial fetch
        };

        this.stompClient.onStompError = (frame) => {
        };

        this.stompClient.onWebSocketClose = (event) => {
        };

        this.stompClient.activate();
    }

    private _updateNotifications(data: any): void {
        this.notifications$.pipe(take(1)).subscribe(notifications => {
            let updatedNotifications = [...notifications];
            if (typeof data === 'string' && data.startsWith('deleted:')) {
                const id = data.split(':')[1];
                updatedNotifications = updatedNotifications.filter(n => n.id !== id);
            } else if (data === 'markAllAsRead') {
                updatedNotifications = updatedNotifications.map(n => ({ ...n, isRead: true }));
            } else {
                const index = updatedNotifications.findIndex(n => n.id === data.id);
                if (index > -1) {
                    updatedNotifications[index] = data;
                } else {
                    updatedNotifications.push(data);
                }
            }
            this._notifications.next(updatedNotifications);
            // Emit event for task/request notifications
            this.taskUpdate$.next();
        });
    }

    getAll(): Observable<Notification[]> {
        const userId = this._userService.getCurrentUserId();
        return this._httpClient.get<Notification[]>(`${this.apiUrl}/api/common/notifications/user/${userId}`).pipe(
            tap((notifications) => {
                this._notifications.next(notifications);
            })
        );
    }

    // Other methods (create, update, delete, markAllAsRead) remain unchanged
    create(notification: Notification): Observable<Notification> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post<Notification>(`${this.apiUrl}/api/common/notifications`, { notification }).pipe(
                map((newNotification) => {
                    this._notifications.next([...notifications, newNotification]);
                    return newNotification;
                })
            ))
        );
    }

    update(id: string, notification: Notification): Observable<Notification> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.patch<Notification>(`${this.apiUrl}/api/common/notifications`, { id, notification }).pipe(
                map((updatedNotification: Notification) => {
                    const index = notifications.findIndex(item => item.id === id);
                    notifications[index] = updatedNotification;
                    this._notifications.next(notifications);
                    return updatedNotification;
                })
            ))
        );
    }

    delete(id: string): Observable<boolean> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.delete<boolean>(`${this.apiUrl}/api/common/notifications`, { params: { id } }).pipe(
                map((isDeleted: boolean) => {
                    const index = notifications.findIndex(item => item.id === id);
                    notifications.splice(index, 1);
                    this._notifications.next(notifications);
                    return isDeleted;
                })
            ))
        );
    }

    markAllAsRead(): Observable<boolean> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.get<boolean>(`${this.apiUrl}/api/common/notifications/mark-all-as-read`).pipe(
                map((isUpdated: boolean) => {
                    notifications.forEach((notification, index) => {
                        notifications[index].isRead = true;
                    });
                    this._notifications.next(notifications);
                    return isUpdated;
                })
            ))
        );
    }
    markAsRead(id: string): Observable<Notification> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post<Notification>(`${this.apiUrl}/api/common/notifications/mark-as-read/${id}`, {}).pipe(
                map((updatedNotification) => {
                    const index = notifications.findIndex(item => item.id === id);
                    if (index > -1) {
                        notifications[index] = updatedNotification;
                        this._notifications.next([...notifications]);
                    }
                    return updatedNotification;
                })
            ))
        );
    }
}