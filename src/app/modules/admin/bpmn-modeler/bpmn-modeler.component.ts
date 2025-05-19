import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import minimapModule from 'diagram-js-minimap';
import { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';
import { CamundaPlatformPropertiesProviderModule } from 'bpmn-js-properties-panel';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { environment } from 'environments/environment';
import { combineLatest } from 'rxjs';
import { DeleteConfirmationDialogComponent, RedeployConfirmationDialogComponent } from './deleteConfirmationDialog.component';

interface ProcessVersion {
  id: string;
  version: number;
  name: string;
  resource: string;
  deploymentId: string;
}

interface ProcessInfo {
  key: string;
  name: string;
  versions: ProcessVersion[];
}

@Component({
  selector: 'app-bpmn-editor',
  template: `
    <div class="flex flex-auto min-w-0 h-screen">
      <div class="w-64 p-4 bg-gray-100 border-r overflow-auto">
        <h2 class="text-lg font-semibold mb-4">Process Versions</h2>
        <div *ngIf="!selectedProcessKey" class="text-gray-500">
          No process selected.
        </div>
        <div *ngIf="selectedProcessKey" class="mb-2">
          <div class="font-medium">{{ selectedProcess?.name || selectedProcess?.key }}</div>
          <select 
            class="w-full p-1 border rounded"
            [(ngModel)]="selectedVersionId"
            (change)="selectVersion(selectedProcessKey, selectedVersionId)">
            <option *ngFor="let version of selectedProcess?.versions" [value]="version.id">
              Version {{ version.version }}: {{ version.name || selectedProcess?.key }}
            </option>
          </select>
        </div>
        <button 
          class="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          (click)="saveDiagram()"
          [disabled]="!selectedProcessKey">
          Save Diagram
        </button>
        <button 
          class="mt-2 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          (click)="confirmRedeploy()"
          [disabled]="!selectedProcessKey">
          Redeploy Process
        </button>
        <button 
          class="mt-2 w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
          (click)="deleteVersion()"
          [disabled]="!selectedVersionId || selectedProcess?.versions.length <= 1">
          Delete Version
        </button>
      </div>
      <div id="canvas" #canvas class="flex-grow"></div>
      <div id="properties" #properties class="w-96"></div>
    </div>
  `,
  styleUrls: ['./bpmn-modeler.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule]
})
export class BpmnModelerComponent implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;
  @ViewChild('properties', { static: false }) propertiesRef!: ElementRef;

  private apiUrl = environment.apiUrl;
  private modeler!: BpmnModeler;
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  processes: ProcessInfo[] = [];
  selectedProcessKey: string | null = null;
  selectedVersionId: string | null = null;
  selectedProcess: ProcessInfo | null = null;

  ngAfterViewInit(): void {
    this.modeler = new BpmnModeler({
      container: this.canvasRef.nativeElement,
      propertiesPanel: {
        parent: this.propertiesRef.nativeElement
      },
      additionalModules: [
        minimapModule,
        BpmnPropertiesPanelModule,
        CamundaPlatformPropertiesProviderModule
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor
      }
    });

    // Combine processes fetch and route params
    combineLatest([
      this.http.get<ProcessInfo[]>(`${this.apiUrl}/api/bpmn/processes`),
      this.route.paramMap
    ]).subscribe({
      next: ([processes, params]) => {
        this.processes = processes;
        const fileName = params.get('fileName');
        const definitionId = params.get('definitionId');

        if (fileName) {
          const process = this.processes.find(p => p.key === fileName || p.name === fileName);
          if (process && process.versions.length > 0) {
            this.selectedProcessKey = process.key;
            this.selectedProcess = process;
            const versionId = definitionId && process.versions.some(v => v.id === definitionId)
              ? definitionId
              : process.versions[0].id; // Fallback to latest version
            this.selectedVersionId = versionId;
            this.loadBpmnFromBackend(versionId);
          } else {
            this.snackBar.open('Process not found.', 'Close', { duration: 5000 });
          }
        } else if (this.processes.length > 0) {
          // Load first process if no route params
          const firstProcess = this.processes[0];
          this.selectVersion(firstProcess.key, firstProcess.versions[0].id);
        }
      },
      error: (err) => {
        console.error('Error fetching processes:', err);
        this.snackBar.open('Failed to load processes.', 'Close', { duration: 5000 });
      }
    });
  }

  selectVersion(processKey: string, definitionId: string): void {
    this.selectedProcessKey = processKey;
    this.selectedVersionId = definitionId;
    this.selectedProcess = this.processes.find(p => p.key === processKey) || null;
    this.router.navigate(['/users/modeler', processKey, definitionId]);
    this.loadBpmnFromBackend(definitionId);
  }

  loadBpmnFromBackend(definitionId: string): void {
    this.http.get(`${this.apiUrl}/api/bpmn/process/${definitionId}`, { responseType: 'text' })
      .subscribe({
        next: (xml: string) => {
          this.loadDiagram(xml);
        },
        error: (err) => {
          console.error('Error fetching BPMN file:', definitionId, err);
          this.snackBar.open('Failed to load process diagram.', 'Close', { duration: 5000 });
        }
      });
  }

  loadDiagram(xml: string): void {
    this.modeler.importXML(xml).catch(err => {
      console.error('Error importing XML:', err);
      this.snackBar.open('Failed to import diagram.', 'Close', { duration: 5000 });
    });
  }

  async saveDiagram(): Promise<void> {
    if (!this.selectedProcessKey) {
      this.snackBar.open('No process selected.', 'Close', { duration: 5000 });
      return;
    }
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.downloadXML(xml, this.selectedProcessKey);
    } catch (err) {
      console.error('Error saving diagram:', err);
      this.snackBar.open('Failed to save diagram.', 'Close', { duration: 5000 });
    }
  }

  private downloadXML(xmlContent: string, fileName: string): void {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.bpmn') ? fileName : fileName + '.bpmn';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  confirmRedeploy(): void {
    const dialogRef = this.dialog.open(RedeployConfirmationDialogComponent, {
      width: '400px',
      data: { processName: this.selectedProcess?.name || this.selectedProcessKey }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.redeployDiagram();
      }
    });
  }

  async redeployDiagram(): Promise<void> {
    if (!this.selectedProcessKey) {
      this.snackBar.open('No process selected for redeployment.', 'Close', { duration: 5000 });
      return;
    }
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.deployToCamunda(xml);
    } catch (err) {
      console.error('Error saving diagram for redeployment:', err);
      this.snackBar.open('Failed to redeploy process.', 'Close', { duration: 5000 });
    }
  }

  private deployToCamunda(xml: string): void {
    this.http.post(`${this.apiUrl}/api/bpmn/deploy`, xml, {
      headers: { 'Content-Type': 'application/xml' },
      params: { fileName: this.selectedProcessKey || 'process' }
    }).subscribe({
      next: () => {
        this.snackBar.open('Process redeployed successfully.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.fetchProcesses(); // Refresh process list
      },
      error: (err) => {
        console.error('Error redeploying BPMN diagram:', err);
        this.snackBar.open('Failed to redeploy process.', 'Close', { duration: 5000 });
      }
    });
  }

  deleteVersion(): void {
    if (!this.selectedVersionId || !this.selectedProcessKey) {
      this.snackBar.open('No version selected for deletion.', 'Close', { duration: 5000 });
      return;
    }
    if (this.selectedProcess?.versions.length <= 1) {
      this.snackBar.open('Cannot delete the only version of a process.', 'Close', { duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '400px',
      data: { versionId: this.selectedVersionId, processName: this.selectedProcess?.name || this.selectedProcessKey }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.delete(`${this.apiUrl}/api/bpmn/process/${this.selectedVersionId}`).subscribe({
          next: () => {
            this.snackBar.open('Version deleted successfully.', 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            this.fetchProcesses(); // Refresh process list
            // Select the latest remaining version
            if (this.selectedProcess) {
              const nextVersion = this.selectedProcess.versions.find(v => v.id !== this.selectedVersionId);
              if (nextVersion) {
                this.selectVersion(this.selectedProcessKey!, nextVersion.id);
              } else {
                this.selectedProcessKey = null;
                this.selectedProcess = null;
                this.selectedVersionId = null;
              }
            }
          },
          error: (err) => {
            console.error('Error deleting version:', err);
            this.snackBar.open('Failed to delete version.', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  private fetchProcesses(): void {
    this.http.get<ProcessInfo[]>(`${this.apiUrl}/api/bpmn/processes`).subscribe({
      next: (processes) => {
        this.processes = processes;
        // Update selected process if still valid
        if (this.selectedProcessKey) {
          const process = this.processes.find(p => p.key === this.selectedProcessKey);
          if (process) {
            this.selectedProcess = process;
            this.selectedVersionId = this.selectedVersionId && process.versions.some(v => v.id === this.selectedVersionId)
              ? this.selectedVersionId
              : process.versions[0]?.id || null;
            if (this.selectedVersionId) {
              this.loadBpmnFromBackend(this.selectedVersionId);
            }
          } else {
            this.selectedProcessKey = null;
            this.selectedProcess = null;
            this.selectedVersionId = null;
          }
        }
      },
      error: (err) => {
        console.error('Error fetching processes:', err);
        this.snackBar.open('Failed to load processes.', 'Close', { duration: 5000 });
      }
    });
  }
}

