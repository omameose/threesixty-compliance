import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { PepCase, ScreeningReviewStatus } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-pep-screening',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './pep-screening.component.html'
})
export class PepScreeningComponent {
  cases: PepCase[] = [];
  loading = true;
  query = '';
  verdictFilter: 'all' | PepCase['verdict'] = 'all';
  selected = signal<PepCase | null>(null);

  runModalOpen = signal(false);
  running = signal(false);
  newSubjectName = '';

  toast = signal('');

  constructor(private data: DataService, private route: ActivatedRoute) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getPepCases().subscribe(c => {
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

  countByVerdict(v: PepCase['verdict']) {
    return this.cases.filter(c => c.verdict === v).length;
  }

  select(c: PepCase) { this.selected.set(c); }

  verdictBadge(v: PepCase['verdict']) {
    return v === 'PEP_MATCH' ? 'badge-red' : v === 'POTENTIAL_PEP' ? 'badge-yellow' : 'badge-green';
  }

  reviewBadge(s: ScreeningReviewStatus) {
    return s === 'confirmed_match' ? 'badge-red' : s === 'escalated' ? 'badge-red' : s === 'false_positive' ? 'badge-green' : 'badge-gray';
  }

  review(status: ScreeningReviewStatus) {
    const c = this.selected();
    if (!c) return;
    this.data.updatePepReview(c.id, status, 'Rukayat Yaro').subscribe(() => {
      this.data.getPepCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash('Review decision recorded.');
    });
  }

  requestEdd() {
    const c = this.selected();
    if (!c) return;
    this.data.requestPepEdd(c.id).subscribe(() => {
      this.data.getPepCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
      this.flash('Enhanced Due Diligence requested.');
    });
  }

  addNote(text: string) {
    const c = this.selected();
    if (!c) return;
    this.data.addPepNote(c.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getPepCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  runScreening() {
    if (!this.newSubjectName.trim()) return;
    this.running.set(true);
    this.data.runPepScreening({ subjectName: this.newSubjectName.trim() }).subscribe(newCase => {
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
