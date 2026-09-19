import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AdverseMediaCase, ScreeningReviewStatus } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-adverse-media',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './adverse-media.component.html'
})
export class AdverseMediaComponent {
  cases: AdverseMediaCase[] = [];
  loading = true;
  query = '';
  verdictFilter: 'all' | AdverseMediaCase['verdict'] = 'all';
  selected = signal<AdverseMediaCase | null>(null);

  runModalOpen = signal(false);
  running = signal(false);
  newSubjectName = '';

  toast = signal('');

  constructor(private data: DataService, private route: ActivatedRoute) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getAdverseMediaCases().subscribe(c => {
      this.cases = c;
      this.loading = false;
      const focusId = this.route.snapshot.queryParamMap.get('caseId');
      if (focusId) {
        const match = c.find(x => x.id === focusId);
        if (match) this.selected.set(match);
      }
    });
  }

  filtered() {
    return this.cases.filter(c => {
      const matchesQuery = !this.query.trim() || c.subjectName.toLowerCase().includes(this.query.toLowerCase());
      const matchesVerdict = this.verdictFilter === 'all' || c.verdict === this.verdictFilter;
      return matchesQuery && matchesVerdict;
    });
  }

  countByVerdict(v: AdverseMediaCase['verdict']) {
    return this.cases.filter(c => c.verdict === v).length;
  }

  select(c: AdverseMediaCase) { this.selected.set(c); }

  verdictBadge(v: AdverseMediaCase['verdict']) {
    return v === 'POTENTIAL_RISK' ? 'badge-yellow' : 'badge-green';
  }

  reviewBadge(s: ScreeningReviewStatus) {
    return s === 'confirmed_match' ? 'badge-red' : s === 'escalated' ? 'badge-red' : s === 'false_positive' ? 'badge-green' : 'badge-gray';
  }

  credibilityBadge(c: 'high' | 'medium' | 'low') {
    return c === 'high' ? 'badge-green' : c === 'medium' ? 'badge-yellow' : 'badge-gray';
  }

  review(status: ScreeningReviewStatus) {
    const c = this.selected();
    if (!c) return;
    this.data.updateAdverseMediaReview(c.id, status, 'Rukayat Yaro').subscribe(() => {
      this.data.getAdverseMediaCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash('Review decision recorded.');
    });
  }

  addNote(text: string) {
    const c = this.selected();
    if (!c) return;
    this.data.addAdverseMediaNote(c.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getAdverseMediaCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  runScreening() {
    if (!this.newSubjectName.trim()) return;
    this.running.set(true);
    this.data.runAdverseMediaScreening({ subjectName: this.newSubjectName.trim() }).subscribe(newCase => {
      this.load();
      this.running.set(false);
      this.runModalOpen.set(false);
      this.select(newCase);
      this.flash('Screening complete.');
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
