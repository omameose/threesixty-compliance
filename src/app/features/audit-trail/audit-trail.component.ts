import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { AuditLogEntry } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  templateUrl: './audit-trail.component.html'
})
export class AuditTrailComponent {
  log: AuditLogEntry[] = [];
  loading = true;
  query = '';

  constructor(private data: DataService) {
    this.data.getAuditLog().subscribe(l => { this.log = l; this.loading = false; });
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.log;
    return this.log.filter(e =>
      e.actor.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) ||
      e.entityType.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q)
    );
  }

  exportCsv() {
    const rows = this.filtered();
    const header = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Old Value', 'New Value', 'Detail'];
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const lines = [
      header.join(','),
      ...rows.map(e => [e.timestamp, e.actor, e.action, e.entityType, e.entityId, e.ipAddress, e.oldValue || '', e.newValue || '', e.detail].map(escape).join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
