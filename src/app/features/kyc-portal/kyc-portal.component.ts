import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { CompanyProfile, ComplianceForm } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Step = 'auth' | 'form' | 'complete';

@Component({
  selector: 'app-kyc-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './kyc-portal.component.html'
})
export class KycPortalComponent implements OnInit {
  @Input() formId!: string;
  complianceId = '';
  email = '';
  password = '';

  company?: CompanyProfile;
  form?: ComplianceForm;
  loading = true;
  step = signal<Step>('auth');
  sectionIndex = signal(0);
  authenticating = false;
  submitting = false;

  answers: Record<string, string> = {};
  fileNames: Record<string, string> = {};

  constructor(private data: DataService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(p => {
      this.complianceId = p.get('cid') || 'CMP-58042';
    });
    this.data.getForm(this.formId).subscribe(f => { this.form = f; this.loading = false; });
    this.data.getCompany().subscribe(c => this.company = c);
  }

  startVerification() {
    this.authenticating = true;
    setTimeout(() => {
      this.authenticating = false;
      this.step.set('form');
    }, 900);
  }

  currentSection() {
    return this.form?.sections[this.sectionIndex()];
  }

  isLastSection() {
    return this.sectionIndex() === (this.form?.sections.length || 1) - 1;
  }

  progressPercent() {
    const total = this.form?.sections.length || 1;
    return Math.round(((this.sectionIndex() + 1) / total) * 100);
  }

  next() {
    if (this.isLastSection()) {
      this.submitting = true;
      setTimeout(() => {
        this.submitting = false;
        this.step.set('complete');
      }, 1200);
    } else {
      this.sectionIndex.update(i => i + 1);
    }
  }

  back() {
    if (this.sectionIndex() > 0) this.sectionIndex.update(i => i - 1);
  }

  onFileChange(event: Event, questionId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.fileNames[questionId] = file.name;
  }
}
