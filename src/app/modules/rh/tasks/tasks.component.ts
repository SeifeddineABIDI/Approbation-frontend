import { Table, TableModule } from 'primeng/table';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Rating, RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [ButtonModule,CommonModule,FormsModule,RatingModule,RippleModule,RadioButtonModule,TableModule, TagModule, RatingModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit{
  customers!: any[];

  representatives!: any[];

  statuses!: any[];

  loading: boolean = true;

  activityValues: number[] = [0, 100];

  constructor( ) {}

  ngOnInit() {
     
this.customers = [
    { id: 1000, name: 'Amy Elsner', country: 'Argentina', company: 'Tech Spares', status: 'unqualified', verified: true, activity: 20, representative: { name: 'Amy Elsner', image: 'amyelsner.png' } },
    { id: 1001, name: 'Anna Fali', country: 'Brazil', company: 'Medical Innovators', status: 'unqualified', verified: true, activity: 10, representative: { name: 'Anna Fali', image: 'annafali.png' } },
    { id: 1002, name: 'Asiya Javayant', country: 'Netherlands', company: 'Bluebox', status: 'negotiation', verified: true, activity: 70, representative: { name: 'Asiya Javayant', image: 'asiyajavayant.png' } },
    { id: 1003, name: 'Bernardo Dominic', country: 'Canada', company: 'Global Treadwell', status: 'renewal', verified: true, activity: 60, representative: { name: 'Bernardo Dominic', image: 'bernardodominic.png' } },
]
      this.representatives = [
          { name: 'Amy Elsner', image: 'amyelsner.png' },
          { name: 'Anna Fali', image: 'annafali.png' },
          { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
          { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
          { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
          { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
          { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
          { name: 'Onyama Limba', image: 'onyamalimba.png' },
          { name: 'Stephen Shaw', image: 'stephenshaw.png' },
          { name: 'Xuxue Feng', image: 'xuxuefeng.png' }
      ];

      this.statuses = [
          { label: 'Unqualified', value: 'unqualified' },
          { label: 'Qualified', value: 'qualified' },
          { label: 'New', value: 'new' },
          { label: 'Negotiation', value: 'negotiation' },
          { label: 'Renewal', value: 'renewal' },
          { label: 'Proposal', value: 'proposal' }
      ];
  }

  clear(table: Table) {
      table.clear();
  }

  getSeverity(status: string) {
      switch (status) {
          case 'unqualified':
              return 'danger';

          case 'qualified':
              return 'success';

          case 'new':
              return 'info';

          case 'negotiation':
              return 'warning';

          case 'renewal':
              return null;
      }
  }
}
