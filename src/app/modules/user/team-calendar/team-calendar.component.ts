import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { fuseAnimations } from '@fuse/animations';
import { LeaveDetailsModalComponent } from '../leave-details-modal/leave-details-modal.component';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-team-calendar',
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      <fuse-alert
        *ngIf="showAlert"
        [type]="alert.type"
        [message]="alert.message"
        (dismissed)="showAlert = false"
        class="mb-4">
      </fuse-alert>
      <full-calendar [options]="calendarOptions"></full-calendar>
    </div>
  `,
  styleUrls: ['./team-calendar.component.scss'],
  standalone: true,
  animations: fuseAnimations,
  imports: [FullCalendarModule, MatDialogModule, FuseAlertComponent]
})
export class TeamCalendarComponent implements OnInit {
  apiUrl = environment.apiUrl;
  authenticatedUserId: string = '';
  leaveEvents: any[] = [];
  alert: { type: FuseAlertType; message: string } = {
    type: 'success',
    message: ''
  };
  showAlert: boolean = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    events: [],
    eventColor: '#f44336',
    height: '100%',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    eventContent: this.renderEventContent.bind(this),
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit() {
    this.getAuthenticatedUser();
    this.fetchTeamLeaves();
  }

  private showAlertMessage(type: FuseAlertType, message: string): void {
    this.alert = { type, message };
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  getAuthenticatedUser() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      this.authenticatedUserId = parsedUser.id;
    } else {
      console.warn('No user found in localStorage');
      this.showAlertMessage('error', 'User authentication failed. Please log in again.');
    }
  }

  fetchTeamLeaves() {
    this.http.get<any[]>(`${this.apiUrl}/api/v1/management/leaves`).subscribe({
      next: (leaves) => {
        console.log('Leaves API response:', leaves);
        this.leaveEvents = leaves.map((leave, index) => {
          if (!leave.type) {
            console.warn(`Leave at index ${index} has no type:`, leave);
            return {
              title: `${leave.user?.firstName ? `${leave.user.firstName} ${leave.user.lastName}` : 'Unknown User'} - Unknown Type`,
              start: leave.startDate,
              end: leave.endDate,
              color: '#f44336', // Default color for missing type
              extendedProps: {
                avatarUrl: this.getAvatarUrl(leave.user?.avatar),
                fullName: leave.user?.firstName ? `${leave.user.firstName} ${leave.user.lastName}` : 'Unknown User',
                leaveEvents: leave,
              },
            };
          }
          const isAuthenticatedUser = leave.user?.id === this.authenticatedUserId;
          return {
            title: `${isAuthenticatedUser ? 'Me' : `${leave.user?.firstName} ${leave.user?.lastName}`} - ${leave.type.name}`,
            start: leave.startDate,
            end: leave.endDate,
            color: leave.type.name === 'Congé' ? '#e67e22' : '#27ae60',
            extendedProps: {
              avatarUrl: this.getAvatarUrl(leave.user?.avatar),
              fullName: isAuthenticatedUser ? 'Me' : `${leave.user?.firstName} ${leave.user?.lastName}`,
              leaveEvents: leave,
            },
          };
        });

        this.calendarOptions.events = this.leaveEvents;
      },
      error: (err) => {
        console.error('Error fetching leaves:', err);
        this.showAlertMessage('error', 'Failed to load team leaves. Please try again.');
      }
    });
  }

  handleEventClick(info: any) {
    const eventDetails = info.event.extendedProps;

    this.dialog.open(LeaveDetailsModalComponent, {
      width: '400px',
      data: eventDetails
    });
  }

  getAvatarUrl(avatarPath: string | undefined): string {
    if (!avatarPath) {
      return 'https://via.placeholder.com/40';
    }
    const baseUrl = `${this.apiUrl}/images/`;
    const cleanedPath = avatarPath.replace('src\\main\\resources\\static\\images\\', '');
    return baseUrl + cleanedPath;
  }

  renderEventContent(eventInfo: any) {
    const avatarUrl = eventInfo.event.extendedProps.avatarUrl || 'https://via.placeholder.com/40';
    const fullName = eventInfo.event.extendedProps.fullName || 'Unknown User';
    const leaveEvent = eventInfo.event.extendedProps.leaveEvents;

    // Set the text color based on the leave type
    const leaveTypeColor = leaveEvent.type?.name === 'Congé' ? 'orange' : leaveEvent.type?.name ? 'green' : 'red';

    return {
      html: `
        <div class="event-content" style="display: flex; align-items: center;">
          <img src="${avatarUrl}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 5px;">
          <span style="color: ${leaveTypeColor};">${fullName}</span>
        </div>`
    };
  }
}