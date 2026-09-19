import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DataService } from '../../../core/services/data.service';
import { ComplianceForm, Customer, CustomerStatus } from '../../../core/models/models';

type ScanType = 'sanctions' | 'pep' | 'adverse-media';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

interface BoardColumn { status: CustomerStatus; label: string; dot: string; }

interface PendingMove {
  customer: Customer;
  toStatus: CustomerStatus;
  toLabel: string;
  previousContainerData: Customer[];
  containerData: Customer[];
  previousIndex: number;
  currentIndex: number;
}

@Component({
  selector: 'app-my-clients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule, PageHeaderComponent, IconComponent, AvatarComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './my-clients-list.component.html'
})
export class MyClientsListComponent implements OnInit {
  customers: Customer[] = [];
  forms: ComplianceForm[] = [];
  loading = true;
  statusFilter = 'all';
  formFilter = 'all';
  riskFilter = 'all';
  query = '';

  viewMode = signal<'table' | 'board'>('board');
  boardColumns: BoardColumn[] = [
    { status: 'not_started', label: 'Not Started', dot: 'bg-ink-400' },
    { status: 'in_progress', label: 'In Progress', dot: 'bg-blue-500' },
    { status: 'pending_review', label: 'Pending Review', dot: 'bg-amber-500' },
    { status: 'more_info_required', label: 'More Info Required', dot: 'bg-purple-500' },
    { status: 'approved', label: 'Approved', dot: 'bg-brand-500' },
    { status: 'rejected', label: 'Rejected', dot: 'bg-red-500' }
  ];
  board: Record<CustomerStatus, Customer[]> = { not_started: [], in_progress: [], pending_review: [], more_info_required: [], approved: [], rejected: [] };
  expandedIds = signal<Set<string>>(new Set());
  pendingMove = signal<PendingMove | null>(null);
  toast = signal('');

  scanMenuOpenFor = signal<string | null>(null);
  scanRunningFor = signal<string | null>(null);

  linkModalOpen = signal(false);
  generatedLink = signal<{ complianceId: string; link: string } | null>(null);
  newCustomerName = '';
  newCustomerEmail = '';
  newCustomerForm = '';
  copied = signal(false);

  constructor(private data: DataService) {}

  ngOnInit() {
    this.data.getForms().subscribe(f => { this.forms = f; this.newCustomerForm = f[0]?.id || ''; });
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getCustomers().subscribe(c => { this.customers = c; this.buildBoard(); this.loading = false; });
  }

  buildBoard() {
    const board: Record<CustomerStatus, Customer[]> = { not_started: [], in_progress: [], pending_review: [], more_info_required: [], approved: [], rejected: [] };
    for (const c of this.customers) board[c.status].push(c);
    this.board = board;
  }

  filtered() {
    return this.customers.filter(c => {
      const matchesStatus = this.statusFilter === 'all' || c.status === this.statusFilter;
      const matchesForm = this.formFilter === 'all' || c.formId === this.formFilter;
      const matchesRisk = this.riskFilter === 'all' || c.riskLevel === this.riskFilter;
      const matchesQuery = !this.query.trim() ||
        c.fullName.toLowerCase().includes(this.query.toLowerCase()) ||
        c.email.toLowerCase().includes(this.query.toLowerCase()) ||
        c.complianceId.toLowerCase().includes(this.query.toLowerCase());
      return matchesStatus && matchesForm && matchesRisk && matchesQuery;
    });
  }

  statusLabel(s: Customer['status']) {
    return { not_started: 'Not Started', in_progress: 'In Progress', pending_review: 'Pending Review', more_info_required: 'More Info Required', approved: 'Approved', rejected: 'Rejected' }[s];
  }

  statusBadgeClass(s: Customer['status']) {
    return {
      not_started: 'badge-gray', in_progress: 'badge-blue', pending_review: 'badge-yellow',
      more_info_required: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red'
    }[s];
  }

  generateLink() {
    if (!this.newCustomerName.trim() || !this.newCustomerForm) return;
    this.data.generateComplianceLink(this.newCustomerName, this.newCustomerForm).subscribe(res => {
      this.generatedLink.set(res);
    });
  }

  copyLink() {
    const link = this.generatedLink();
    if (!link) return;
    navigator.clipboard?.writeText(link.link).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  closeLinkModal() {
    this.linkModalOpen.set(false);
    this.generatedLink.set(null);
    this.newCustomerName = '';
    this.newCustomerEmail = '';
  }

  // ===== Board view =====

  boardCardMatches(c: Customer) {
    const matchesForm = this.formFilter === 'all' || c.formId === this.formFilter;
    const matchesRisk = this.riskFilter === 'all' || c.riskLevel === this.riskFilter;
    const matchesQuery = !this.query.trim() ||
      c.fullName.toLowerCase().includes(this.query.toLowerCase()) ||
      c.email.toLowerCase().includes(this.query.toLowerCase()) ||
      c.complianceId.toLowerCase().includes(this.query.toLowerCase());
    return matchesForm && matchesRisk && matchesQuery;
  }

  boardVisibleCount(status: CustomerStatus) {
    return this.board[status].filter(c => this.boardCardMatches(c)).length;
  }

  isExpanded(id: string) { return this.expandedIds().has(id); }
  toggleExpand(id: string) {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  moveUp(status: CustomerStatus, index: number) {
    if (index <= 0) return;
    const col = this.board[status];
    [col[index - 1], col[index]] = [col[index], col[index - 1]];
    this.commitBoardOrder();
  }

  moveDown(status: CustomerStatus, index: number) {
    const col = this.board[status];
    if (index >= col.length - 1) return;
    [col[index], col[index + 1]] = [col[index + 1], col[index]];
    this.commitBoardOrder();
  }

  drop(event: CdkDragDrop<Customer[]>, toStatus: CustomerStatus) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.commitBoardOrder();
      return;
    }

    const customer = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.pendingMove.set({
      customer,
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
    pm.customer.status = pm.toStatus;
    this.data.updateCustomerStatus(pm.customer.id, pm.toStatus).subscribe(() => {
      this.commitBoardOrder();
      this.pendingMove.set(null);
      this.flash(`${pm.customer.fullName} moved to ${pm.toLabel}.`);
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
    this.customers = flat;
    this.data.reorderCustomers(flat);
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }

  // ===== Quick intelligence scans =====

  toggleScanMenu(customerId: string) {
    this.scanMenuOpenFor.update(current => current === customerId ? null : customerId);
  }

  runQuickScan(customer: Customer, type: ScanType) {
    this.scanMenuOpenFor.set(null);
    if (this.scanRunningFor()) return;
    this.scanRunningFor.set(customer.id);

    const dob = customer.answers.find(a => a.label === 'Date of Birth')?.value;
    const onDone = (label: string, verdict: string) => {
      this.scanRunningFor.set(null);
      this.flash(`${label} for ${customer.fullName} complete — result: ${verdict.replace('_', ' ')}.`);
    };

    if (type === 'sanctions') {
      this.data.runSanctionsScreening({ subjectName: customer.fullName, subjectType: 'Individual', dob, nationality: customer.country, country: customer.country, identifiers: [customer.complianceId], customerId: customer.id })
        .subscribe(result => onDone('Sanctions Screening', result.verdict));
    } else if (type === 'pep') {
      this.data.runPepScreening({ subjectName: customer.fullName, customerId: customer.id })
        .subscribe(result => onDone('PEP Screening', result.verdict));
    } else {
      this.data.runAdverseMediaScreening({ subjectName: customer.fullName, customerId: customer.id })
        .subscribe(result => onDone('Adverse Media Screening', result.verdict));
    }
  }
}
