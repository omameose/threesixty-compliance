import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Sector } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sector-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header title="Compliance Templates" subtitle="Choose a sector to browse ready-made KYC/KYB/AML templates for your industry.">
      <div class="relative w-64 hidden sm:block">
        <app-icon name="search" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"></app-icon>
        <input class="input pl-9" placeholder="Search sectors..." [(ngModel)]="query"/>
      </div>
    </app-page-header>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <a *ngFor="let s of filteredSectors()" [routerLink]="['/app/templates', s.id]"
         class="card p-6 hover:shadow-lg hover:-translate-y-0.5 transition group">
        <div class="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition">
          <app-icon [name]="s.icon" [size]="24"></app-icon>
        </div>
        <h3 class="font-semibold text-ink-900 mb-1.5">{{ s.name }}</h3>
        <p class="text-sm text-ink-500 mb-4 line-clamp-2">{{ s.description }}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="badge-gray">{{ s.industries.length }} industries</span>
          <span class="text-brand-600 font-medium flex items-center gap-1">Browse <app-icon name="chevron-right" [size]="14"></app-icon></span>
        </div>
      </a>
    </div>
  `
})
export class SectorListComponent implements OnInit {
  sectors: Sector[] = [];
  query = '';

  constructor(private data: DataService) {}

  ngOnInit() {
    this.data.getSectors().subscribe(s => this.sectors = s);
  }

  filteredSectors() {
    if (!this.query.trim()) return this.sectors;
    const q = this.query.toLowerCase();
    return this.sectors.filter(s => s.name.toLowerCase().includes(q));
  }
}
