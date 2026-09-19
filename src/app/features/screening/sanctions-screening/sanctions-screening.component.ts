import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { SanctionsCase, ScreeningReviewStatus } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { VERIFICATION_COUNTRIES } from '../../../core/mock/verification-details.mock';

@Component({
  selector: 'app-sanctions-screening',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './sanctions-screening.component.html'
})
export class SanctionsScreeningComponent {
  cases: SanctionsCase[] = [];
  loading = true;
  query = '';
  verdictFilter: 'all' | SanctionsCase['verdict'] = 'all';
  selected = signal<SanctionsCase | null>(null);

  countries = VERIFICATION_COUNTRIES;
  runModalOpen = signal(false);
  running = signal(false);
  newSubjectName = '';
  newSubjectType: 'Individual' | 'Business' = 'Individual';
  newDob = '';
  newNationality = '';
  newCountry = '';
  newIdentifiers = '';

  toast = signal('');

  constructor(private data: DataService, private route: ActivatedRoute) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getSanctionsCases().subscribe(c => {
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

  countByVerdict(v: SanctionsCase['verdict']) {
    return this.cases.filter(c => c.verdict === v).length;
  }

  select(c: SanctionsCase) {
    this.selected.set(c);
  }

  verdictBadge(v: SanctionsCase['verdict']) {
    return v === 'MATCH' ? 'badge-red' : v === 'POTENTIAL_MATCH' ? 'badge-yellow' : 'badge-green';
  }

  reviewBadge(s: ScreeningReviewStatus) {
    return s === 'confirmed_match' ? 'badge-red' : s === 'escalated' ? 'badge-red' : s === 'false_positive' ? 'badge-green' : 'badge-gray';
  }

  review(status: ScreeningReviewStatus) {
    const c = this.selected();
    if (!c) return;
    this.data.updateSanctionsReview(c.id, status, 'Rukayat Yaro').subscribe(() => {
      this.data.getSanctionsCase(c.id).subscribe(updated => {
        if (updated) this.selected.set(updated);
        this.load();
      });
      this.flash('Review decision recorded.');
    });
  }

  addNote(text: string) {
    const c = this.selected();
    if (!c) return;
    this.data.addSanctionsNote(c.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getSanctionsCase(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  openRunModal() {
    this.newSubjectName = '';
    this.newSubjectType = 'Individual';
    this.newDob = '';
    this.newNationality = '';
    this.newCountry = '';
    this.newIdentifiers = '';
    this.runModalOpen.set(true);
  }

  runScreening() {
    if (!this.newSubjectName.trim()) return;
    this.running.set(true);
    this.data.runSanctionsScreening({
      subjectName: this.newSubjectName.trim(),
      subjectType: this.newSubjectType,
      dob: this.newDob || undefined,
      nationality: this.newNationality,
      country: this.newCountry,
      identifiers: this.newIdentifiers ? this.newIdentifiers.split(',').map(s => s.trim()) : []
    }).subscribe(newCase => {
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
