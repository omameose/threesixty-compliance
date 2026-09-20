import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { ComplianceApiService } from '../../../core/services/compliance-api.service';
import { Industry, Sector } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, IconComponent],
  template: `
    <nav class="flex items-center gap-1.5 text-sm text-ink-400 mb-3 flex-wrap">
      <a routerLink="/app/templates" class="hover:text-brand-600">Compliance Templates</a>
      <app-icon name="chevron-right" [size]="14"></app-icon>
      <a [routerLink]="['/app/templates', sectorId]" class="hover:text-brand-600">{{ sector?.name }}</a>
      <app-icon name="chevron-right" [size]="14"></app-icon>
      <span class="text-ink-700 font-medium">{{ industry?.name }}</span>
    </nav>

    <app-page-header [title]="industry?.name || ''" [subtitle]="industry?.description || ''">
      <div class="flex items-center bg-ink-100 rounded-lg p-1">
        <button class="px-2.5 py-1.5 rounded-md" [class.bg-white]="view() === 'grid'" [class.shadow-sm]="view() === 'grid'" (click)="view.set('grid')">
          <app-icon name="grid" [size]="16"></app-icon>
        </button>
        <button class="px-2.5 py-1.5 rounded-md" [class.bg-white]="view() === 'list'" [class.shadow-sm]="view() === 'list'" (click)="view.set('list')">
          <app-icon name="list" [size]="16"></app-icon>
        </button>
      </div>
      <a [routerLink]="['/app/templates', sectorId]" class="btn-secondary"><app-icon name="arrow-left" [size]="15"></app-icon> Back</a>
    </app-page-header>

    <div *ngIf="error" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error }}</div>
    <div *ngIf="industry" [ngSwitch]="view()">
      <div *ngSwitchCase="'grid'" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let tpl of industry.templates" class="card p-6 flex flex-col">
          <div class="flex items-start justify-between mb-3">
            <span class="badge-green">{{ tpl.type }}</span>
            <span class="badge-yellow" *ngIf="tpl.popular">Popular</span>
          </div>
          <h3 class="font-semibold text-ink-900 mb-1.5">{{ tpl.name }}</h3>
          <p class="text-sm text-ink-500 mb-4 line-clamp-2 flex-1">{{ tpl.description }}</p>
          <div class="flex items-center justify-between text-xs text-ink-400 mb-4">
            <span>{{ tpl.fieldsCount }} fields</span>
            <span>Updated {{ tpl.updatedAt }}</span>
          </div>
          <a [routerLink]="['/app/templates', sectorId, industryId, tpl.id]" class="btn-primary w-full">Preview & Use</a>
        </div>
      </div>

      <div *ngSwitchCase="'list'" class="card overflow-x-auto">
        <table class="table">
          <thead><tr><th>Template</th><th>Type</th><th>Fields</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let tpl of industry.templates">
              <td>
                <p class="font-medium text-ink-900">{{ tpl.name }}</p>
                <p class="text-xs text-ink-400 max-w-md truncate">{{ tpl.description }}</p>
              </td>
              <td><span class="badge-green">{{ tpl.type }}</span></td>
              <td>{{ tpl.fieldsCount }}</td>
              <td>{{ tpl.updatedAt }}</td>
              <td><a [routerLink]="['/app/templates', sectorId, industryId, tpl.id]" class="btn-secondary btn-sm">Preview</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TemplateListComponent implements OnChanges {
  @Input() sectorId!: string;
  @Input() industryId!: string;
  sector?: Sector;
  industry?: Industry;
  view = signal<'grid' | 'list'>('grid');
  error = '';

  constructor(private api: ComplianceApiService) {}

  ngOnChanges() {
    if (this.sectorId) this.api.sector(this.sectorId).subscribe({ next: s => this.sector = s, error: (e: ApiError) => this.error = e.userMessage });
    if (this.sectorId && this.industryId) {
      this.api.industry(this.sectorId, this.industryId).subscribe({
        next: i => { this.industry = i; this.error = i ? '' : 'That industry was not found.'; },
        error: (e: ApiError) => this.error = e.userMessage
      });
    }
  }
}
