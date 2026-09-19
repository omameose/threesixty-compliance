import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ComplianceCase } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, AvatarComponent, ModalComponent],
  templateUrl: './case-detail.component.html'
})
export class CaseDetailComponent implements OnChanges {
  @Input() caseId!: string;
  case?: ComplianceCase;
  loading = true;

  closeModalOpen = signal(false);
  closeRationale = '';
  actionSuccess = signal('');

  constructor(private data: DataService, private router: Router) {}

  ngOnChanges() {
    this.loading = true;
    this.data.getCase(this.caseId).subscribe(c => { this.case = c; this.loading = false; });
  }

  statusBadge(s: ComplianceCase['status']) {
    return s === 'closed' ? 'badge-green' : s === 'escalated' ? 'badge-red' : s === 'investigating' || s === 'pending_info' ? 'badge-blue' : s === 'decision' ? 'badge-yellow' : 'badge-gray';
  }

  advance(next: ComplianceCase['status'], label: string, note?: string) {
    if (!this.case) return;
    this.data.updateCaseStatus(this.case.id, next, {
      label,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      actor: 'Rukayat Yaro',
      note
    }).subscribe(() => {
      this.data.getCase(this.caseId).subscribe(c => this.case = c);
      this.flash(`Case moved to "${next.replace('_', ' ')}".`);
    });
  }

  escalateToStrSar() {
    this.advance('escalated', 'Escalated to MLRO for STR/SAR filing decision');
    setTimeout(() => this.router.navigate(['/app/str-sar']), 800);
  }

  confirmClose() {
    this.advance('closed', 'Case closed with rationale', this.closeRationale || undefined);
    this.closeModalOpen.set(false);
    this.closeRationale = '';
  }

  private flash(msg: string) {
    this.actionSuccess.set(msg);
    setTimeout(() => this.actionSuccess.set(''), 2500);
  }
}
