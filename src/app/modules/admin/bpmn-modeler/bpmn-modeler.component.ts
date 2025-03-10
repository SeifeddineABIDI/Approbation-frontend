import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import minimapModule from 'diagram-js-minimap';
import { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';
import { CamundaPlatformPropertiesProviderModule } from 'bpmn-js-properties-panel';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { defaultNavigation } from 'app/mock-api/common/navigation/data';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-bpmn-editor',
  templateUrl: './bpmn-modeler.component.html',
  styleUrls: ['./bpmn-modeler.component.scss'],
  standalone: true,
  imports: [CommonModule,FormsModule]
})
export class BpmnModelerComponent implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;
  @ViewChild('properties', { static: false }) propertiesRef!: ElementRef;
  
  private apiUrl = environment.apiUrl;
  private modeler!: BpmnModeler;
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private navigationService = inject(NavigationService);
  filenames: string[] = [];
  selectedFile: string = '';

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

    this.fetchFileList();

    // Handle route param changes
    this.route.paramMap.subscribe(params => {
      const fileName = params.get('fileName') ? decodeURIComponent(params.get('fileName')!) : null;
      if (fileName && fileName !== this.selectedFile && this.filenames.includes(fileName)) {
        this.selectFile(fileName);
      }
    });

    // Handle initial default from service
    this.navigationService.selectedBpmnFile$.subscribe((fileName) => {
      if (fileName && !this.selectedFile && !this.route.snapshot.paramMap.get('fileName')) {
        this.selectFile(fileName);
      }
    });
  }

  fetchFileList(): void {
    this.http.get<string[]>(`${this.apiUrl}/api/bpmn/files`)
      .subscribe({
        next: (files) => {
          this.filenames = files;
          if (files.length > 0 && !this.selectedFile && !this.route.snapshot.paramMap.get('fileName')) {
            this.selectedFile = files[0];
            this.loadBpmnFromBackend(this.selectedFile);
          }
        },
        error: (err) => console.error('Error fetching file list:', err)
      });
  }

  selectFile(fileName: string): void {
    if (this.filenames.includes(fileName)) {
      this.selectedFile = fileName;
      this.loadBpmnFromBackend(this.selectedFile);
    } else {
      console.warn('File not found in list:', fileName);
    }
  }

  loadBpmnFromBackend(fileName: string): void {
    this.http.get(`${this.apiUrl}/api/bpmn/${fileName}`, { responseType: 'text' })
      .subscribe({
        next: (xml: string) => {
          this.loadDiagram(xml);
        },
        error: (err) => console.error('Error fetching BPMN file:', fileName, err)
      });
  }

  loadDiagram(xml: string): void {
    this.modeler.importXML(xml).catch(err => {
      console.error('Error importing XML:', err);
    });
  }

  async saveDiagram(): Promise<void> {
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.downloadXML(xml, this.selectedFile);
    } catch (err) {
      console.error('Error saving diagram:', err);
    }
  }

  private downloadXML(xmlContent: string, fileName: string): void {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async redeployDiagram(): Promise<void> {
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.deployToCamunda(xml);
    } catch (err) {
      console.error('Error saving diagram for redeployment:', err);
    }
  }

  private deployToCamunda(xml: string): void {
    const formData = new FormData();
    const blob = new Blob([xml], { type: 'application/xml' });
    formData.append('file', blob, this.selectedFile);

    this.http.put(`${this.apiUrl}/api/bpmn/deploy`, formData, { responseType: 'text' })
      .subscribe({
        next: (response) => console.log('Redeployment successful:', response),
        error: (err) => console.error('Error redeploying BPMN diagram:', err)
      });
  }
}