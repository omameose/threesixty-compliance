import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { EddCase } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { NotesPanelComponent } from '../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-edd',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, AvatarComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './edd.component.html'
})
export class EddComponent {
  cases: EddCase[] = [];
  loading = true;
  query = '';
  statusFilter: 'all' | EddCase['status'] = 'all';
  selected = signal<EddCase | null>(null);
  toast = signal('');

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getEddCases().subscribe(c => { this.cases = c; this.loading = false; });
  }

  filtered() {
    return this.cases.filter(c => {
      const matchesQuery = !this.query.trim() || c.customerName.toLowerCase().includes(this.query.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || c.status === this.statusFilter;
      return matchesQuery && matchesStatus;
    });
  }

  countByStatus(s: EddCase['status']) {
    return this.cases.filter(c => c.status === s).length;
  }

  select(c: EddCase) { this.selected.set(c); }

  statusBadge(s: EddCase['status']) {
    return s === 'completed' ? 'badge-green' : s === 'blocked' ? 'badge-red' : s === 'in_progress' ? 'badge-blue' : 'badge-gray';
  }

  checklistPct(c: EddCase) {
    if (!c.checklist.length) return 100;
    return Math.round((c.checklist.filter(i => i.completed).length / c.checklist.length) * 100);
  }

  toggleItem(c: EddCase, item: string) {
    this.data.toggleEddChecklistItem(c.id, item).subscribe(() => {
      this.data.getEddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
    });
  }

  setStatus(c: EddCase, status: EddCase['status']) {
    this.data.updateEddStatus(c.id, status).subscribe(() => {
      this.data.getEddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash(`EDD case marked as ${status.replace('_', ' ')}.`);
    });
  }

  addNote(text: string) {
    const c = this.selected();
    if (!c) return;
    this.data.addEddNote(c.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getEddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
