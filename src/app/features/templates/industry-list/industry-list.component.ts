import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { ComplianceApiService } from '../../../core/services/compliance-api.service';
import { Sector } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-industry-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, IconComponent],
  template: `
    <nav class="flex items-center gap-1.5 text-sm text-ink-400 mb-3">
      <a routerLink="/app/templates" class="hover:text-brand-600">Compliance Templates</a>
      <app-icon name="chevron-right" [size]="14"></app-icon>
      <span class="text-ink-700 font-medium">{{ sector?.name }}</span>
    </nav>

    <app-page-header [title]="sector?.name || ''" [subtitle]="sector?.description || ''">
      <a routerLink="/app/templates" class="btn-secondary"><app-icon name="arrow-left" [size]="15"></app-icon> All Sectors</a>
    </app-page-header>

    <div *ngIf="error" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error }}</div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="sector">
      <a *ngFor="let ind of sector.industries" [routerLink]="['/app/templates', sector.id, ind.id]"
         class="card p-6 hover:shadow-lg hover:-translate-y-0.5 transition group">
        <div class="w-11 h-11 rounded-xl bg-ink-100 text-ink-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition">
          <app-icon name="layers" [size]="20"></app-icon>
        </div>
        <h3 class="font-semibold text-ink-900 mb-1.5">{{ ind.name }}</h3>
        <p class="text-sm text-ink-500 mb-4 line-clamp-2">{{ ind.description }}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="badge-gray">{{ ind.templates.length }} templates</span>
          <span class="text-brand-600 font-medium flex items-center gap-1">View <app-icon name="chevron-right" [size]="14"></app-icon></span>
        </div>
      </a>
    </div>
  `
})
export class IndustryListComponent implements OnChanges {
  @Input() sectorId!: string;
  sector?: Sector;
  error = '';

  constructor(private api: ComplianceApiService) {}

  ngOnChanges() {
    if (this.sectorId) this.api.sector(this.sectorId).subscribe({
      next: s => { this.sector = s; this.error = s ? '' : 'That sector was not found.'; },
      error: (e: ApiError) => this.error = e.userMessage
    });
  }
}
