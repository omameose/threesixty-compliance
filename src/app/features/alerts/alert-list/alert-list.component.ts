import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Alert, AlertStatus } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent, AvatarComponent, EmptyStateComponent],
  templateUrl: './alert-list.component.html'
})
export class AlertListComponent {
  alerts: Alert[] = [];
  loading = true;
  statusFilter: 'all' | AlertStatus = 'all';
  toastMessage = signal('');

  constructor(private data: DataService, private router: Router) {
    this.data.getAlerts().subscribe(a => { this.alerts = a; this.loading = false; });
  }

  filtered() {
    return this.statusFilter === 'all' ? this.alerts : this.alerts.filter(a => a.status === this.statusFilter);
  }

  severityBadge(s: Alert['severity']) {
    return s === 'critical' ? 'badge-red' : s === 'high' ? 'badge-red' : s === 'medium' ? 'badge-yellow' : 'badge-gray';
  }

  statusBadge(s: AlertStatus) {
    return s === 'closed' ? 'badge-green' : s === 'escalated' ? 'badge-red' : s === 'investigating' ? 'badge-blue' : s === 'assigned' ? 'badge-yellow' : 'badge-gray';
  }

  assignToMe(alert: Alert) {
    this.data.updateAlertStatus(alert.id, 'assigned', 'Rukayat Yaro').subscribe(() => {
      this.alerts = this.alerts.map(a => a.id === alert.id ? { ...a, status: 'assigned', assignedTo: 'Rukayat Yaro' } : a);
      this.notify('Alert assigned to you.');
    });
  }

  escalate(alert: Alert) {
    this.data.updateAlertStatus(alert.id, 'escalated').subscribe(() => {
      this.alerts = this.alerts.map(a => a.id === alert.id ? { ...a, status: 'escalated' } : a);
      this.notify('Alert escalated.');
    });
  }

  close(alert: Alert) {
    this.data.updateAlertStatus(alert.id, 'closed').subscribe(() => {
      this.alerts = this.alerts.map(a => a.id === alert.id ? { ...a, status: 'closed' } : a);
      this.notify('Alert closed.');
    });
  }

  convertToCase(alert: Alert) {
    this.data.convertAlertToCase(alert.id).subscribe(res => {
      if (res.success) {
        this.notify('Case opened from alert.');
        this.router.navigate(['/app/cases', res.caseId]);
      }
    });
  }

  private notify(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 2500);
  }
}
