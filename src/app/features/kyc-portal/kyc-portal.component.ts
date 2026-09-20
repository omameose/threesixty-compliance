import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { PortalApiService, PortalFile, PortalForm, PortalQuestion, PortalSection, PortalSession, PortalSubmission } from '../../core/services/portal-api.service';
import { UtilService } from '../../core/services/util.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Stage = 'start' | 'otp' | 'form' | 'complete' | 'locked';

/**
 * What a customer sees when they open a compliance link (/kyc/<linkCode>): their details, an emailed code, the form section by section
 * with every section saved as they go (so they can close the tab and resume), and a final submit. Only the link code and a session
 * token identify them; nothing here needs an account.
 */
@Component({
  selector: 'app-kyc-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './kyc-portal.component.html'
})
export class KycPortalComponent implements OnInit {
  /** Bound from the route parameter. */
  @Input() linkCode!: string;

  form?: PortalForm;
  loading = true;
  loadError = '';
  stage = signal<Stage>('start');
  sectionIndex = signal(0);
  busy = signal(false);
  error = signal('');
  notice = signal('');
  countries: string[] = [];

  // customer details
  fullName = '';
  email = '';
  phone = '';
  country = '';
  otp = '';

  // the submission in progress
  private token = '';
  submission?: PortalSubmission;
  answers: Record<string, any> = {};
  files: PortalFile[] = [];
  fieldErrors: Record<string, string> = {};
  idResults: Record<string, string> = {};
  completionMessage = '';

  constructor(private api: PortalApiService, private util: UtilService) {}

  get brand() {
    return this.form?.branding ?? {};
  }
  get color() {
    return this.brand.primaryColor || '#128a4d';
  }

  ngOnInit() {
    this.util.countries$.subscribe({ next: c => this.countries = c.map(x => x.name), error: () => undefined });
    this.api.form(this.linkCode).subscribe({
      next: f => {
        this.form = f;
        this.loading = false;
        this.resume();
      },
      error: (e: ApiError) => {
        this.loading = false;
        this.loadError = e.httpStatus === 404 ? 'This link is not valid, or it has been switched off.' : e.userMessage;
      }
    });
  }

  private storageKey() {
    return '360k_' + this.linkCode;
  }

  /** A customer who closed the tab comes back to where they were, if their session is still valid. */
  private resume() {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(this.storageKey()); } catch { /* storage unavailable */ }
    if (!saved) return;
    this.token = saved;
    this.api.submission(this.linkCode, saved).subscribe({
      next: s => this.enter(s),
      error: () => { this.token = ''; try { sessionStorage.removeItem(this.storageKey()); } catch { /* ignore */ } }
    });
  }

  // ------------------------------------------------------------------ start and code

  start() {
    this.error.set('');
    if (!this.fullName.trim() || !this.email.trim()) {
      this.error.set('Please enter your full name and email address.');
      return;
    }
    this.busy.set(true);
    this.api.start(this.linkCode, { fullName: this.fullName.trim(), email: this.email.trim(), phone: this.phone.trim() || undefined, country: this.country || undefined }).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.otpRequired || !r.session) {
          this.notice.set(r.message || 'We emailed you a code.');
          this.stage.set('otp');
        } else {
          this.accept(r.session);
        }
      },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  verifyOtp() {
    this.error.set('');
    if (!/^\d{4,10}$/.test(this.otp.trim())) {
      this.error.set('Enter the numeric code from your email.');
      return;
    }
    this.busy.set(true);
    this.api.verifyOtp(this.linkCode, this.email.trim(), this.otp.trim()).subscribe({
      next: s => { this.busy.set(false); this.accept(s); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  private accept(session: PortalSession) {
    this.token = session.token;
    try { sessionStorage.setItem(this.storageKey(), session.token); } catch { /* storage unavailable: resume simply will not work */ }
    this.notice.set('');
    this.enter(session.submission);
  }

  private enter(s: PortalSubmission) {
    this.submission = s;
    this.answers = { ...(s.answers ?? {}) };
    this.files = s.files ?? [];
    this.fieldErrors = {};
    if (!s.editable) {
      this.stage.set(['pending_review', 'approved', 'rejected'].includes(s.status) ? 'complete' : 'locked');
      this.completionMessage = this.completionMessage || this.brand.completionMessage || '';
      return;
    }
    this.sectionIndex.set(0);
    this.stage.set('form');
  }

  // ------------------------------------------------------------------ form

  visibleSections(): PortalSection[] {
    return (this.form?.sections ?? []).filter(s => s.questions.some(q => this.visible(q)));
  }

  currentSection(): PortalSection | undefined {
    return this.visibleSections()[this.sectionIndex()];
  }

  isLast() {
    return this.sectionIndex() >= this.visibleSections().length - 1;
  }

  progress() {
    const n = this.visibleSections().length || 1;
    return Math.round(((this.sectionIndex() + 1) / n) * 100);
  }

  /** Same rule as the server: a question can appear only when another question has the expected answer. */
  visible(q: PortalQuestion): boolean {
    if (!q.visibleWhen) return true;
    const trigger = this.answers[q.visibleWhen.questionId];
    const want = q.visibleWhen.equals.toLowerCase();
    if (Array.isArray(trigger)) return trigger.some(v => String(v).toLowerCase() === want);
    return trigger !== undefined && trigger !== null && String(trigger).trim().toLowerCase() === want;
  }

  set(q: PortalQuestion, value: unknown) {
    if (value === '' || value === undefined) delete this.answers[q.id];
    else this.answers[q.id] = value;
    delete this.fieldErrors[q.id];
  }

  isChecked(q: PortalQuestion, label: string) {
    const v = this.answers[q.id];
    return Array.isArray(v) && v.includes(label);
  }

  toggle(q: PortalQuestion, label: string, on: boolean) {
    const cur: string[] = Array.isArray(this.answers[q.id]) ? [...this.answers[q.id]] : [];
    const next = on ? [...new Set([...cur, label])] : cur.filter(x => x !== label);
    this.set(q, next.length ? next : undefined);
  }

  filesFor(q: PortalQuestion) {
    return this.files.filter(f => f.questionId === q.id);
  }

  private missing(section: PortalSection): boolean {
    let any = false;
    for (const q of section.questions) {
      if (!this.visible(q) || !q.required) continue;
      const has = q.type === 'file_upload' ? this.filesFor(q).length > 0 : this.answers[q.id] !== undefined && this.answers[q.id] !== '';
      if (!has) { this.fieldErrors[q.id] = 'This question is required'; any = true; }
    }
    return any;
  }

  /** Only answers to visible questions are sent, so hidden ones never linger from an earlier choice. */
  private visibleAnswers(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const s of this.form?.sections ?? []) for (const q of s.questions) if (this.visible(q) && this.answers[q.id] !== undefined) out[q.id] = this.answers[q.id];
    return out;
  }

  next() {
    const section = this.currentSection();
    if (!section) return;
    this.error.set('');
    this.fieldErrors = {};
    if (this.missing(section)) {
      this.error.set('Please answer the highlighted questions.');
      return;
    }
    this.busy.set(true);
    this.api.saveAnswers(this.linkCode, this.token, this.visibleAnswers()).subscribe({
      next: r => {
        const here = new Set(section.questions.map(q => q.id));
        const errs = Object.entries(r.errors ?? {}).filter(([id]) => here.has(id));
        this.fieldErrors = Object.fromEntries(Object.entries(r.errors ?? {}));
        if (errs.length) {
          this.busy.set(false);
          this.error.set('Please correct the highlighted answers.');
          return;
        }
        if (this.isLast()) this.finish();
        else { this.busy.set(false); this.sectionIndex.update(i => i + 1); window.scrollTo({ top: 0 }); }
      },
      error: (e: ApiError) => { this.busy.set(false); this.handleSessionError(e); }
    });
  }

  back() {
    if (this.sectionIndex() > 0) this.sectionIndex.update(i => i - 1);
  }

  private finish() {
    this.api.submit(this.linkCode, this.token).subscribe({
      next: r => {
        this.busy.set(false);
        this.submission = r.submission;
        this.completionMessage = r.completionMessage;
        try { sessionStorage.removeItem(this.storageKey()); } catch { /* ignore */ }
        this.stage.set('complete');
      },
      error: (e: ApiError) => { this.busy.set(false); this.handleSessionError(e); }
    });
  }

  private handleSessionError(e: ApiError) {
    if (e.httpStatus === 401) {
      this.token = '';
      try { sessionStorage.removeItem(this.storageKey()); } catch { /* ignore */ }
      this.stage.set('start');
      this.error.set('Your session expired. Please enter your details again to continue where you left off.');
    } else {
      this.error.set(e.userMessage);
    }
  }

  // ------------------------------------------------------------------ files and ID checks

  onFile(ev: Event, q: PortalQuestion) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.busy.set(true);
    this.api.uploadFile(this.linkCode, this.token, q.id, file).subscribe({
      next: f => { this.busy.set(false); this.files = [...this.files, f]; delete this.fieldErrors[q.id]; input.value = ''; },
      error: (e: ApiError) => { this.busy.set(false); input.value = ''; this.fieldErrors[q.id] = e.userMessage; }
    });
  }

  removeFile(f: PortalFile) {
    this.api.deleteFile(this.linkCode, this.token, f.fileId).subscribe({
      next: () => this.files = this.files.filter(x => x.fileId !== f.fileId),
      error: (e: ApiError) => this.error.set(e.userMessage)
    });
  }

  /** Saves the answer first so the server checks the value the customer just typed. */
  verifyId(q: PortalQuestion) {
    this.error.set('');
    this.busy.set(true);
    this.api.saveAnswers(this.linkCode, this.token, this.visibleAnswers()).subscribe({
      next: () => this.api.verifyId(this.linkCode, this.token, q.id).subscribe({
        next: r => { this.busy.set(false); this.idResults[q.id] = r.message || r.status; },
        error: (e: ApiError) => { this.busy.set(false); this.idResults[q.id] = e.userMessage; }
      }),
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }
}
