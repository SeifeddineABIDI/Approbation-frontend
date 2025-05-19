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
import { environment } from 'environments/environment';

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
        <h2 class="text-lg font-semibold mb-4">Processes</h2>
        <div *ngIf="processes.length === 0" class="text-gray-500">
          No processes found.
        </div>
        <div *ngFor="let process of processes" class="mb-2">
          <div class="font-medium">{{ process.name || process.key }}</div>
          <select 
            class="w-full p-1 border rounded"
            [(ngModel)]="selectedVersions[process.key]"
            (change)="selectVersion(process.key, selectedVersions[process.key])">
            <option *ngFor="let version of process.versions" [value]="version.id">
              Version {{ version.version }}: {{ version.name || process.key }}
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
          (click)="redeployDiagram()"
          [disabled]="!selectedProcessKey">
          Redeploy Process
        </button>
      </div>
      <div id="canvas" #canvas class="flex-grow"></div>
      <div id="properties" #properties class="w-96"></div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .border-r {
      border-right: 1px solid #e5e7eb;
    }
    select, button {
      font-size: 0.875rem;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BpmnModelerComponent implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;
  @ViewChild('properties', { static: false }) propertiesRef!: ElementRef;

  private apiUrl = environment.apiUrl;
  private modeler!: BpmnModeler;
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  processes: ProcessInfo[] = [];
  selectedVersions: { [key: string]: string } = {};
  selectedProcessKey: string | null = null;

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

    this.fetchProcesses();

    // Handle route param changes
    this.route.paramMap.subscribe(params => {
      const fileName = params.get('fileName');
      if (fileName) {
        // Find the process and latest version matching the fileName (key or name)
        const process = this.processes.find(p => p.key === fileName || p.name === fileName);
        if (process && process.versions.length > 0) {
          this.selectedProcessKey = process.key;
          this.selectedVersions[process.key] = process.versions[0].id; // Default to latest version
          this.loadBpmnFromBackend(process.versions[0].id);
        }
      }
    });
  }

  fetchProcesses(): void {
    this.http.get<ProcessInfo[]>(`${this.apiUrl}/api/bpmn/processes`)
      .subscribe({
        next: (processes) => {
          this.processes = processes;
          // Initialize selected versions (default to latest version)
          this.processes.forEach(process => {
            if (process.versions.length > 0) {
              this.selectedVersions[process.key] = process.versions[0].id;
            }
          });
          // Load the first process if no route params
          if (this.processes.length > 0 && !this.route.snapshot.paramMap.get('fileName')) {
            const firstProcess = this.processes[0];
            this.selectVersion(firstProcess.key, firstProcess.versions[0].id);
          }
        },
        error: (err) => console.error('Error fetching processes:', err)
      });
  }

  selectVersion(processKey: string, definitionId: string): void {
    this.selectedProcessKey = processKey;
    this.selectedVersions[processKey] = definitionId;
    // Update route to reflect selected process and version
    this.router.navigate(['/users/modeler', processKey]);
    this.loadBpmnFromBackend(definitionId);
  }

  loadBpmnFromBackend(definitionId: string): void {
    this.http.get(`${this.apiUrl}/api/bpmn/process/${definitionId}`, { responseType: 'text' })
      .subscribe({
        next: (xml: string) => {
          this.loadDiagram(xml);
        },
        error: (err) => console.error('Error fetching BPMN file:', definitionId, err)
      });
  }

  loadDiagram(xml: string): void {
    this.modeler.importXML(xml).catch(err => {
      console.error('Error importing XML:', err);
    });
  }

  async saveDiagram(): Promise<void> {
    if (!this.selectedProcessKey) {
      console.error('No process selected');
      return;
    }
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.downloadXML(xml, this.selectedProcessKey);
    } catch (err) {
      console.error('Error saving diagram:', err);
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

  async redeployDiagram(): Promise<void> {
    if (!this.selectedProcessKey) {
      console.error('No process selected for redeployment');
      return;
    }
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.deployToCamunda(xml);
    } catch (err) {
      console.error('Error saving diagram for redeployment:', err);
    }
  }

  private deployToCamunda(xml: string): void {
    this.http.post(`${this.apiUrl}/api/bpmn/deploy`, xml, {
      headers: { 'Content-Type': 'application/xml' },
      params: { fileName: this.selectedProcessKey || 'process' }
    }).subscribe({
      next: () => {
        console.log('Process redeployed successfully');
        // Refresh process list
        this.fetchProcesses();
      },
      error: (err) => console.error('Error redeploying BPMN diagram:', err)
    });
  }
}