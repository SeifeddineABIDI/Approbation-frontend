import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveDetailsModalComponent } from '../leave-details-modal/leave-details-modal.component';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-team-calendar',
  templateUrl: './team-calendar.component.html',
  styleUrls: ['./team-calendar.component.scss'],
  standalone: true,
  imports: [FullCalendarModule, MatDialogModule]
})
export class TeamCalendarComponent implements OnInit {
  apiUrl=environment.apiUrl;
  authenticatedUserId: string = '';
  leaveEvents: any[] = [];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth', // Default view
    selectable: true,
    events: [],
    eventColor: '#f44336', // Default event color
    height: '100%', 
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek' // Added week view option
    },
    eventContent: this.renderEventContent.bind(this),
    eventClick: this.handleEventClick.bind(this),
  };
  

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit() {
    this.getAuthenticatedUser();
    this.fetchTeamLeaves();
  }
  getAuthenticatedUser() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      this.authenticatedUserId = parsedUser.id;
    }
  }
  fetchTeamLeaves() {
    this.http
      .get<any[]>(`${this.apiUrl}/api/v1/management/leaves`)
      .subscribe((leaves) => {
        this.leaveEvents = leaves.map((leave) => {
          const isAuthenticatedUser = leave.user?.id === this.authenticatedUserId;
          const userName = leave.user?.firstName && leave.user?.lastName 
            ? `${leave.user.firstName} ${leave.user.lastName}`
            : 'Unknown User';
          return {
            title: `${isAuthenticatedUser ? 'Me' : userName} - ${leave.type?.name || 'Unknown Type'}`,
            start: leave.startDate,
            end: leave.endDate,
            color: leave.type?.name === 'Congé' ? '#e67e22' : leave.type?.name ? '#27ae60' : '#f44336',
            extendedProps: {
              avatarUrl: this.getAvatarUrl(leave.user?.avatar),
              fullName: isAuthenticatedUser ? 'Me' : userName,
              leaveEvents: leave,
            },
          };
        });
  
        this.calendarOptions.events = this.leaveEvents;
      });
  }
  
  
  handleEventClick(info: any) {
    const eventDetails = info.event.extendedProps;

    this.dialog.open(LeaveDetailsModalComponent, {
      width: '400px',
      data: eventDetails
    });
  }

  getAvatarUrl(avatarPath: string): string {
    const baseUrl = `${this.apiUrl}/images/`;
    const cleanedPath = avatarPath ? avatarPath.replace('src\\main\\resources\\static\\images\\', '') : '';
    return avatarPath ? baseUrl + cleanedPath : 'https://via.placeholder.com/40';
  }

  renderEventContent(eventInfo: any) {
    const avatarUrl = eventInfo.event.extendedProps.avatarUrl || 'https://via.placeholder.com/40';
    const fullName = eventInfo.event.extendedProps.fullName || 'Unknown User';
    const leaveEvent = eventInfo.event.extendedProps.leaveEvents;
  
    // Set the text color based on the leave type
    const leaveTypeColor = leaveEvent.type?.name === 'Congé' ? 'orange' : leaveEvent.type?.name ? 'green' : 'black';
  
    return {
      html: `
        <div class="event-content" style="display: flex; align-items: center;">
          <img src="${avatarUrl}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 5px;">
          <span style="color: ${leaveTypeColor};">${fullName}</span> <!-- Display the full name with dynamic color -->
        </div>`
    };
  }
  
  
}