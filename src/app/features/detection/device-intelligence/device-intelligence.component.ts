import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Customer, DeviceProfile } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-device-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent, EmptyStateComponent],
  templateUrl: './device-intelligence.component.html'
})
export class DeviceIntelligenceComponent {
  devices: DeviceProfile[] = [];
  customersByName = new Map<string, Customer>();
  loading = true;
  query = '';
  selected = signal<DeviceProfile | null>(null);

  constructor(private data: DataService) {
    this.data.getCustomers().subscribe(customers => {
      for (const c of customers) this.customersByName.set(c.fullName, c);
    });
    this.data.getDevices().subscribe(d => { this.devices = d; this.loading = false; });
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.devices;
    return this.devices.filter(d => d.deviceId.toLowerCase().includes(q) || d.linkedCustomers.some(c => c.toLowerCase().includes(q)));
  }

  select(d: DeviceProfile) { this.selected.set(d); }

  sharedDevices() {
    return this.devices.filter(d => d.linkedCustomers.length > 1);
  }

  highRiskCount() {
    return this.devices.filter(d => d.riskLevel === 'high').length;
  }

  riskBadge(l: DeviceProfile['riskLevel']) {
    return l === 'high' ? 'badge-red' : l === 'medium' ? 'badge-yellow' : 'badge-green';
  }

  customerId(name: string): string | undefined {
    return this.customersByName.get(name)?.id;
  }

  otherLinkedDevices(d: DeviceProfile) {
    // Surfaces other devices sharing a linked customer with the selected device — useful for drilling into a mule/fraud ring.
    return this.devices.filter(other => other.id !== d.id && other.linkedCustomers.some(name => d.linkedCustomers.includes(name)));
  }
}
