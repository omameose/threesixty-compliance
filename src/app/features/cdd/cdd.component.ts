import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { CddCase } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { NotesPanelComponent } from '../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cdd',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, AvatarComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './cdd.component.html'
})
export class CddComponent {
  cases: CddCase[] = [];
  loading = true;
  query = '';
  statusFilter: 'all' | CddCase['status'] = 'all';
  selected = signal<CddCase | null>(null);
  toast = signal('');

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getCddCases().subscribe(c => { this.cases = c; this.loading = false; });
  }

  filtered() {
    return this.cases.filter(c => {
      const matchesQuery = !this.query.trim() || c.customerName.toLowerCase().includes(this.query.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || c.status === this.statusFilter;
      return matchesQuery && matchesStatus;
    });
  }

  countByStatus(s: CddCase['status']) {
    return this.cases.filter(c => c.status === s).length;
  }

  select(c: CddCase) { this.selected.set(c); }

  statusBadge(s: CddCase['status']) {
    return s === 'completed' ? 'badge-green' : s === 'pending_review' ? 'badge-yellow' : 'badge-blue';
  }

  completionPct(c: CddCase) {
    const required = c.fields.filter(f => f.required);
    if (!required.length) return 100;
    return Math.round((required.filter(f => f.completed).length / required.length) * 100);
  }

  avgCompletion() {
    if (!this.cases.length) return 0;
    return Math.round(this.cases.reduce((s, c) => s + this.completionPct(c), 0) / this.cases.length);
  }

  updateField(c: CddCase, label: string, value: string) {
    this.data.updateCddField(c.id, label, value).subscribe(() => {
      this.data.getCddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
    });
  }

  submitForReview(c: CddCase) {
    this.data.submitCddForReview(c.id).subscribe(() => {
      this.data.getCddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash('Submitted for compliance review.');
    });
  }

  approve(c: CddCase) {
    this.data.approveCdd(c.id, 'Rukayat Yaro').subscribe(() => {
      this.data.getCddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash('CDD approved.');
    });
  }

  addNote(text: string) {
    const c = this.selected();
    if (!c) return;
    this.data.addCddNote(c.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getCddCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
