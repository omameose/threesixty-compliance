import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ComplianceTemplateSummary, FormSection, Industry, Sector } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MOCK_FORMS } from '../../../core/mock/forms.mock';

@Component({
  selector: 'app-template-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, IconComponent],
  template: `
    <nav class="flex items-center gap-1.5 text-sm text-ink-400 mb-3 flex-wrap">
      <a routerLink="/app/templates" class="hover:text-brand-600">Compliance Templates</a>
      <app-icon name="chevron-right" [size]="14"></app-icon>
      <a [routerLink]="['/app/templates', sectorId]" class="hover:text-brand-600">{{ sector?.name }}</a>
      <app-icon name="chevron-right" [size]="14"></app-icon>
      <a [routerLink]="['/app/templates', sectorId, industryId]" class="hover:text-brand-600">{{ industry?.name }}</a>
      <app-icon name="chevron-right" [size]="14"></app-icon>
      <span class="text-ink-700 font-medium">{{ template?.name }}</span>
    </nav>

    <div class="card p-6 mb-6" *ngIf="template">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="badge-green">{{ template.type }}</span>
            <span class="badge-yellow" *ngIf="template.popular">Popular</span>
          </div>
          <h1 class="text-2xl font-bold text-ink-950">{{ template.name }}</h1>
          <p class="muted mt-1 max-w-2xl">{{ template.description }}</p>
        </div>
        <div class="flex gap-3 shrink-0">
          <a [routerLink]="['/app/templates', sectorId, industryId]" class="btn-secondary"><app-icon name="arrow-left" [size]="15"></app-icon> Back</a>
          <button class="btn-primary" (click)="useTemplate()"><app-icon name="form-builder" [size]="16"></app-icon> Use This Template</button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ink-100">
        <div><p class="muted">Fields</p><p class="font-semibold text-ink-900">{{ template.fieldsCount }}</p></div>
        <div><p class="muted">Sections</p><p class="font-semibold text-ink-900">{{ previewSections.length }}</p></div>
        <div><p class="muted">Last Updated</p><p class="font-semibold text-ink-900">{{ template.updatedAt }}</p></div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="font-semibold text-ink-900 mb-1">Form Preview</h3>
      <p class="muted mb-5">This is what your customers will see. You can customize every field after using this template.</p>

      <div class="space-y-6 max-w-2xl">
        <div *ngFor="let sec of previewSections; let i = index">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{{ i + 1 }}</span>
            <h4 class="font-semibold text-ink-900">{{ sec.title }}</h4>
          </div>
          <div class="space-y-4 pl-8">
            <div *ngFor="let q of sec.questions">
              <label class="label">{{ q.label }} <span class="text-red-500" *ngIf="q.required">*</span></label>
              <input *ngIf="['short_text','email','phone','number','date'].includes(q.type)" class="input" disabled [placeholder]="q.label"/>
              <textarea *ngIf="q.type === 'long_text'" class="input" rows="2" disabled [placeholder]="q.label"></textarea>
              <select *ngIf="['dropdown','country'].includes(q.type)" class="input" disabled><option>Select an option</option></select>
              <div *ngIf="q.type === 'radio'" class="flex gap-4">
                <label class="flex items-center gap-1.5 text-sm text-ink-600" *ngFor="let o of q.options"><input type="radio" disabled/>{{ o.label }}</label>
              </div>
              <div *ngIf="q.type === 'checkbox'" class="flex gap-4">
                <label class="flex items-center gap-1.5 text-sm text-ink-600" *ngFor="let o of q.options"><input type="checkbox" disabled/>{{ o.label }}</label>
              </div>
              <div *ngIf="q.type === 'file_upload' || q.type === 'id_document'" class="border-2 border-dashed border-ink-200 rounded-lg p-4 text-center text-ink-400 text-sm">
                <app-icon name="upload" [size]="18" class="mx-auto mb-1"></app-icon> Upload file
              </div>
              <input *ngIf="q.type === 'address'" class="input" disabled placeholder="Street address, city, state"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TemplatePreviewComponent implements OnChanges {
  @Input() sectorId!: string;
  @Input() industryId!: string;
  @Input() templateId!: string;

  sector?: Sector;
  industry?: Industry;
  template?: ComplianceTemplateSummary;
  previewSections: FormSection[] = [];

  constructor(private data: DataService, private router: Router) {}

  ngOnChanges() {
    if (this.sectorId) this.data.getSector(this.sectorId).subscribe(s => this.sector = s);
    if (this.sectorId && this.industryId) this.data.getIndustry(this.sectorId, this.industryId).subscribe(i => this.industry = i);
    if (this.templateId) {
      this.data.getTemplate(this.templateId).subscribe(res => {
        this.template = res?.template;
        this.buildPreviewSections();
      });
    }
  }

  private buildPreviewSections() {
    const type = this.template?.type || 'KYC';
    const source = type === 'KYB' ? MOCK_FORMS.find(f => f.id === 'form-002')
      : type === 'AML' ? MOCK_FORMS.find(f => f.id === 'form-004')
      : type === 'Combined' ? MOCK_FORMS.find(f => f.id === 'form-003')
      : MOCK_FORMS.find(f => f.id === 'form-001');
    this.previewSections = JSON.parse(JSON.stringify(source?.sections || []));
  }

  useTemplate() {
    this.router.navigate(['/app/form-builder'], { queryParams: { templateId: this.templateId } });
  }
}
