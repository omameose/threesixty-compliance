import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { MonitoringScheduleEntry } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-continuous-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent],
  templateUrl: './continuous-monitoring.component.html'
})
export class ContinuousMonitoringComponent {
  entries: MonitoringScheduleEntry[] = [];
  loading = true;
  query = '';
  runningId = signal<string | null>(null);
  toast = signal('');

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getMonitoringSchedule().subscribe(e => { this.entries = e; this.loading = false; });
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.entries;
    return this.entries.filter(e => e.customerName.toLowerCase().includes(q) || e.monitoringType.toLowerCase().includes(q));
  }

  activeCount() { return this.entries.filter(e => e.status === 'active').length; }
  pausedCount() { return this.entries.filter(e => e.status === 'paused').length; }
  changesDetectedCount() { return this.entries.filter(e => e.lastResult === 'change_detected').length; }

  resultBadge(r: MonitoringScheduleEntry['lastResult']) {
    return r === 'change_detected' ? 'badge-red' : 'badge-green';
  }

  statusBadge(s: MonitoringScheduleEntry['status']) {
    return s === 'active' ? 'badge-green' : 'badge-gray';
  }

  toggleStatus(e: MonitoringScheduleEntry) {
    this.data.toggleMonitoringStatus(e.id).subscribe(() => this.load());
  }

  runNow(e: MonitoringScheduleEntry) {
    this.runningId.set(e.id);
    this.data.runMonitoringNow(e.id).subscribe(res => {
      this.runningId.set(null);
      this.load();
      this.flash(res.changeDetected ? `Change detected for ${e.customerName} — review recommended.` : `Re-screen complete for ${e.customerName} — no change.`);
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
