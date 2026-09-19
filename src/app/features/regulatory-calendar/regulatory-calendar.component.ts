import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DataService } from '../../core/services/data.service';
import { ObligationStatus, RegulatoryObligation } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../shared/components/notes-panel/notes-panel.component';

interface BoardColumn { status: ObligationStatus; label: string; dot: string; }

interface PendingMove {
  obligation: RegulatoryObligation;
  toStatus: ObligationStatus;
  toLabel: string;
  previousContainerData: RegulatoryObligation[];
  containerData: RegulatoryObligation[];
  previousIndex: number;
  currentIndex: number;
}

const CATEGORIES: RegulatoryObligation['category'][] = ['STR', 'CTR', 'Training', 'KYC Review', 'Policy Review', 'License', 'Regulatory Return'];

@Component({
  selector: 'app-regulatory-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, PageHeaderComponent, IconComponent, ModalComponent, NotesPanelComponent],
  templateUrl: './regulatory-calendar.component.html'
})
export class RegulatoryCalendarComponent implements OnInit {
  obligations: RegulatoryObligation[] = [];
  loading = true;
  query = '';
  categories = CATEGORIES;

  boardColumns: BoardColumn[] = [
    { status: 'overdue', label: 'Overdue', dot: 'bg-red-500' },
    { status: 'due_this_week', label: 'Due This Week', dot: 'bg-amber-500' },
    { status: 'completed', label: 'Completed', dot: 'bg-brand-500' }
  ];
  board: Record<ObligationStatus, RegulatoryObligation[]> = { overdue: [], due_this_week: [], completed: [] };

  expandedIds = signal<Set<string>>(new Set());
  pendingMove = signal<PendingMove | null>(null);
  deleteTarget = signal<RegulatoryObligation | null>(null);
  viewTarget = signal<RegulatoryObligation | null>(null);
  toast = signal('');

  addModalOpen = signal(false);
  newTitle = '';
  newDescription = '';
  newCategory: RegulatoryObligation['category'] = 'STR';
  newDueDate = '';
  newOwner = '';

  constructor(private data: DataService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.data.getObligations().subscribe(o => { this.obligations = o; this.buildBoard(); this.loading = false; });
  }

  buildBoard() {
    const board: Record<ObligationStatus, RegulatoryObligation[]> = { overdue: [], due_this_week: [], completed: [] };
    for (const o of this.obligations) board[o.status].push(o);
    this.board = board;
  }

  boardCardMatches(o: RegulatoryObligation) {
    const q = this.query.trim().toLowerCase();
    if (!q) return true;
    return o.title.toLowerCase().includes(q) || o.owner.toLowerCase().includes(q) || o.category.toLowerCase().includes(q);
  }

  boardVisibleCount(status: ObligationStatus) {
    return this.board[status].filter(o => this.boardCardMatches(o)).length;
  }

  daysToDue(dueDate: string) {
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  // ===== Expand / collapse =====
  isExpanded(id: string) { return this.expandedIds().has(id); }
  toggleExpand(id: string) {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ===== Reorder within a column =====
  moveUp(status: ObligationStatus, index: number) {
    if (index <= 0) return;
    const col = this.board[status];
    [col[index - 1], col[index]] = [col[index], col[index - 1]];
    this.commitBoardOrder();
  }

  moveDown(status: ObligationStatus, index: number) {
    const col = this.board[status];
    if (index >= col.length - 1) return;
    [col[index], col[index + 1]] = [col[index + 1], col[index]];
    this.commitBoardOrder();
  }

  // ===== Drag and drop between columns =====
  drop(event: CdkDragDrop<RegulatoryObligation[]>, toStatus: ObligationStatus) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.commitBoardOrder();
      return;
    }

    const obligation = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.pendingMove.set({
      obligation,
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
    pm.obligation.status = pm.toStatus;
    this.data.updateObligationStatus(pm.obligation.id, pm.toStatus).subscribe(() => {
      this.commitBoardOrder();
      this.pendingMove.set(null);
      this.flash(`Moved to ${pm.toLabel}.`);
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
    this.obligations = flat;
    this.data.reorderObligations(flat);
  }

  // ===== Delete =====
  confirmDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.data.deleteObligation(target.id).subscribe(() => {
      this.deleteTarget.set(null);
      this.load();
      this.flash('Obligation deleted.');
    });
  }

  // ===== View details + notes =====
  openView(o: RegulatoryObligation) { this.viewTarget.set(o); }

  addNote(text: string) {
    const o = this.viewTarget();
    if (!o) return;
    this.data.addObligationNote(o.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getObligation(o.id).subscribe(updated => { if (updated) this.viewTarget.set(updated); });
      this.load();
    });
  }

  markCompleteFromView() {
    const o = this.viewTarget();
    if (!o) return;
    this.data.updateObligationStatus(o.id, 'completed').subscribe(() => {
      this.viewTarget.set(null);
      this.load();
      this.flash('Marked as completed.');
    });
  }

  // ===== Add new obligation =====
  openAddModal() {
    this.newTitle = '';
    this.newDescription = '';
    this.newCategory = 'STR';
    this.newDueDate = '';
    this.newOwner = '';
    this.addModalOpen.set(true);
  }

  createObligation() {
    if (!this.newTitle.trim() || !this.newDueDate || !this.newOwner.trim()) return;
    const status: ObligationStatus = this.daysToDue(this.newDueDate) < 0 ? 'overdue' : 'due_this_week';
    const obligation: RegulatoryObligation = {
      id: 'ob-' + Date.now(), title: this.newTitle.trim(), description: this.newDescription.trim() || undefined,
      category: this.newCategory, dueDate: this.newDueDate, status, owner: this.newOwner.trim(), notes: []
    };
    this.data.addObligation(obligation).subscribe(() => {
      this.addModalOpen.set(false);
      this.load();
      this.flash('Obligation added.');
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
