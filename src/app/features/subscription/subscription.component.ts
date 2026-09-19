import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { Invoice, Plan, Subscription } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, IconComponent, ModalComponent],
  templateUrl: './subscription.component.html'
})
export class SubscriptionComponent implements OnInit {
  plans: Plan[] = [];
  subscription?: Subscription;
  invoices: Invoice[] = [];
  loading = true;
  changeModalOpen = signal(false);
  cancelModalOpen = signal(false);
  targetPlan?: Plan;

  constructor(private data: DataService) {}

  ngOnInit() {
    this.data.getPlans().subscribe(p => this.plans = p);
    this.data.getSubscription().subscribe(s => this.subscription = s);
    this.data.getInvoices().subscribe(i => { this.invoices = i; this.loading = false; });
  }

  currentPlan() {
    return this.plans.find(p => p.id === this.subscription?.planId);
  }

  usagePercent() {
    const u = this.subscription?.usage;
    if (!u || !u.included) return 0;
    return Math.min(100, Math.round((u.used / u.included) * 100));
  }

  openChange(plan: Plan) {
    this.targetPlan = plan;
    this.changeModalOpen.set(true);
  }

  confirmChange() {
    if (!this.targetPlan || !this.subscription) return;
    this.subscription = { ...this.subscription, planId: this.targetPlan.id };
    this.changeModalOpen.set(false);
  }

  confirmCancel() {
    if (!this.subscription) return;
    this.subscription = { ...this.subscription, status: 'canceled' };
    this.cancelModalOpen.set(false);
  }
}
