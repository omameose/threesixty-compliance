import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DataService } from '../../../core/services/data.service';
import { ComplianceForm, ComplianceFormStatus } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

interface BoardColumn { status: ComplianceFormStatus; label: string; dot: string; }

interface PendingMove {
  form: ComplianceForm;
  toStatus: ComplianceFormStatus;
  toLabel: string;
  previousContainerData: ComplianceForm[];
  containerData: ComplianceForm[];
  previousIndex: number;
  currentIndex: number;
}

@Component({
  selector: 'app-my-compliance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule, PageHeaderComponent, IconComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './my-compliance-list.component.html'
})
export class MyComplianceListComponent implements OnInit {
  forms: ComplianceForm[] = [];
  loading = true;
  statusFilter = 'all';
  query = '';
  deleteTarget = signal<ComplianceForm | null>(null);

  viewMode = signal<'table' | 'board'>('board');
  boardColumns: BoardColumn[] = [
    { status: 'draft', label: 'Draft', dot: 'bg-ink-400' },
    { status: 'in_review', label: 'In Review', dot: 'bg-blue-500' },
    { status: 'live', label: 'Live', dot: 'bg-brand-500' },
    { status: 'paused', label: 'Paused', dot: 'bg-purple-500' },
    { status: 'archived', label: 'Archived', dot: 'bg-ink-300' }
  ];
  board: Record<ComplianceFormStatus, ComplianceForm[]> = { draft: [], in_review: [], live: [], paused: [], archived: [] };
  expandedIds = signal<Set<string>>(new Set());
  pendingMove = signal<PendingMove | null>(null);

  constructor(private data: DataService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.data.getForms().subscribe(f => { this.forms = f; this.buildBoard(); this.loading = false; });
  }

  buildBoard() {
    const board: Record<ComplianceFormStatus, ComplianceForm[]> = { draft: [], in_review: [], live: [], paused: [], archived: [] };
    for (const f of this.forms) board[f.status].push(f);
    this.board = board;
  }

  filtered() {
    return this.forms.filter(f => {
      const matchesStatus = this.statusFilter === 'all' || f.status === this.statusFilter;
      const matchesQuery = !this.query.trim() || f.name.toLowerCase().includes(this.query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }

  confirmDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.data.deleteForm(target.id).subscribe(() => {
      this.deleteTarget.set(null);
      this.load();
    });
  }

  completionRate(f: ComplianceForm) {
    if (!f.submissionsCount) return 0;
    return Math.round((f.completedCount / f.submissionsCount) * 100);
  }

  // ===== Board view =====

  boardCardMatches(f: ComplianceForm) {
    return !this.query.trim() || f.name.toLowerCase().includes(this.query.toLowerCase());
  }

  boardVisibleCount(status: ComplianceFormStatus) {
    return this.board[status].filter(f => this.boardCardMatches(f)).length;
  }

  isExpanded(id: string) {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: string) {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  moveUp(status: ComplianceFormStatus, index: number) {
    if (index <= 0) return;
    const col = this.board[status];
    [col[index - 1], col[index]] = [col[index], col[index - 1]];
    this.commitBoardOrder();
  }

  moveDown(status: ComplianceFormStatus, index: number) {
    const col = this.board[status];
    if (index >= col.length - 1) return;
    [col[index], col[index + 1]] = [col[index + 1], col[index]];
    this.commitBoardOrder();
  }

  drop(event: CdkDragDrop<ComplianceForm[]>, toStatus: ComplianceFormStatus) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.commitBoardOrder();
      return;
    }

    const form = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.pendingMove.set({
      form,
      toStatus,
      toLabel: this.boardColumns.find(c => c.status === toStatus)?.label || toStatus,
      previousContainerData: event.previousContainer.data,
      containerData: event.container.data,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });
  }

  confirmMove() {
    const pm = this.pendingMove();
    if (!pm) return;
    pm.form.status = pm.toStatus;
    this.data.updateFormStatus(pm.form.id, pm.toStatus).subscribe(() => {
      this.commitBoardOrder();
      this.pendingMove.set(null);
    });
  }

  cancelMove() {
    const pm = this.pendingMove();
    if (!pm) return;
    transferArrayItem(pm.containerData, pm.previousContainerData, pm.currentIndex, pm.previousIndex);
    this.pendingMove.set(null);
  }

  private commitBoardOrder() {
    const flat = this.boardColumns.flatMap(c => this.board[c.status]);
    this.forms = flat;
    this.data.reorderForms(flat);
  }
}
