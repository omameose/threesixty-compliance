import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { ComplianceApiService } from '../../core/services/compliance-api.service';
import { ComplianceForm, FormQuestion, FormSection, QuestionOption, QuestionType } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

interface QuestionTypeMeta { type: QuestionType; label: string; icon: string; }

let uid = 1000;
function genId(prefix: string) { return prefix + '-' + (uid++); }

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, ModalComponent],
  templateUrl: './form-builder.component.html'
})
export class FormBuilderComponent implements OnInit {
  @Input() formId?: string;

  formName = 'Untitled Compliance Form';
  formType: ComplianceForm['type'] = 'KYC';
  status: ComplianceForm['status'] = 'draft';
  sections = signal<FormSection[]>([]);
  saving = false;
  saved = false;
  previewMode = signal(false);
  publishModalOpen = signal(false);
  activeQuestionTypeMenu: string | null = null;

  questionTypes: QuestionTypeMeta[] = [
    { type: 'short_text', label: 'Short Text', icon: 'edit' },
    { type: 'long_text', label: 'Paragraph', icon: 'list' },
    { type: 'dropdown', label: 'Dropdown', icon: 'chevron-down' },
    { type: 'radio', label: 'Multiple Choice', icon: 'check-circle' },
    { type: 'checkbox', label: 'Checkboxes', icon: 'check' },
    { type: 'file_upload', label: 'File Upload', icon: 'upload' },
    { type: 'date', label: 'Date', icon: 'clock' },
    { type: 'email', label: 'Email', icon: 'mail' },
    { type: 'phone', label: 'Phone Number', icon: 'phone' },
    { type: 'number', label: 'Number', icon: 'gauge' },
    { type: 'country', label: 'Country', icon: 'globe' },
    { type: 'id_document', label: 'ID Document', icon: 'id-card' },
    { type: 'address', label: 'Address', icon: 'building' },
    { type: 'signature', label: 'Signature', icon: 'edit' }
  ];

  error = '';
  loading = false;
  /** Set once the form exists on the server; a brand-new form only gets an id on its first save. */
  currentId?: string;

  constructor(private api: ComplianceApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    if (this.formId) {
      this.currentId = this.formId;
      this.loading = true;
      this.api.form(this.formId).subscribe({
        next: f => {
          this.loading = false;
          this.formName = f.summary.name;
          this.formType = f.summary.type;
          this.status = f.summary.status;
          this.sections.set(f.sections?.length ? JSON.parse(JSON.stringify(f.sections)) : [{ id: genId('sec'), title: 'Section 1', description: '', questions: [] }]);
        },
        error: (e: ApiError) => { this.loading = false; this.error = e.userMessage; }
      });
      return;
    }

    const templateId = this.route.snapshot.queryParamMap.get('templateId');
    if (templateId) {
      // Older links: copy the template into a real form first, then continue on that form's own address.
      this.api.useTemplate(templateId).subscribe({
        next: id => this.router.navigate(['/app/form-builder', id], { replaceUrl: true }),
        error: (e: ApiError) => this.error = e.userMessage
      });
      return;
    }
    this.sections.set([{ id: genId('sec'), title: 'Section 1', description: '', questions: [] }]);
  }

  addSection() {
    this.sections.update(list => [...list, { id: genId('sec'), title: 'Section ' + (list.length + 1), description: '', questions: [] }]);
  }

  removeSection(sectionId: string) {
    this.sections.update(list => list.filter(s => s.id !== sectionId));
  }

  toggleTypeMenu(sectionId: string) {
    this.activeQuestionTypeMenu = this.activeQuestionTypeMenu === sectionId ? null : sectionId;
  }

  addQuestion(sectionId: string, type: QuestionType) {
    const meta = this.questionTypes.find(q => q.type === type);
    const needsOptions = ['dropdown', 'radio', 'checkbox'].includes(type);
    const question: FormQuestion = {
      id: genId('q'),
      type,
      label: meta?.label + ' Question',
      required: true,
      placeholder: '',
      helpText: '',
      options: needsOptions ? [{ id: genId('opt'), label: 'Option 1' }, { id: genId('opt'), label: 'Option 2' }] : undefined,
      acceptedFileTypes: type === 'file_upload' ? '.jpg,.png,.pdf' : undefined
    };
    this.sections.update(list => list.map(s => s.id === sectionId ? { ...s, questions: [...s.questions, question] } : s));
    this.activeQuestionTypeMenu = null;
  }

  removeQuestion(sectionId: string, questionId: string) {
    this.sections.update(list => list.map(s => s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s));
  }

  moveQuestion(sectionId: string, index: number, dir: -1 | 1) {
    this.sections.update(list => list.map(s => {
      if (s.id !== sectionId) return s;
      const questions = [...s.questions];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= questions.length) return s;
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      return { ...s, questions };
    }));
  }

  addOption(sectionId: string, questionId: string) {
    this.sections.update(list => list.map(s => s.id === sectionId ? {
      ...s, questions: s.questions.map(q => q.id === questionId ? { ...q, options: [...(q.options || []), { id: genId('opt'), label: 'Option ' + ((q.options?.length || 0) + 1) }] } : q)
    } : s));
  }

  removeOption(sectionId: string, questionId: string, optionId: string) {
    this.sections.update(list => list.map(s => s.id === sectionId ? {
      ...s, questions: s.questions.map(q => q.id === questionId ? { ...q, options: (q.options || []).filter(o => o.id !== optionId) } : q)
    } : s));
  }

  totalQuestions() {
    return this.sections().reduce((sum, s) => sum + s.questions.length, 0);
  }

  /** Saves the form (creating it on the first save); `live` publishes it afterwards. The server's message is shown if it refuses. */
  save(newStatus: ComplianceForm['status']) {
    if (!this.formName.trim()) {
      this.error = 'Give the form a name first.';
      return;
    }
    this.saving = true;
    this.error = '';
    const sections = this.sections();
    const persist = this.currentId
      ? this.api.updateForm(this.currentId, { name: this.formName.trim(), sections })
      : this.api.createForm({ name: this.formName.trim(), type: this.formType, sections });
    persist.subscribe({
      next: f => {
        this.currentId = f.summary.id;
        if (newStatus === 'live' && this.status !== 'live') {
          this.api.setFormStatus(f.summary.id, 'live').subscribe({
            next: () => this.finish('live'),
            error: (e: ApiError) => { this.saving = false; this.publishModalOpen.set(false); this.error = e.userMessage; this.afterFirstSave(); }
          });
        } else {
          this.finish(this.status);
        }
      },
      error: (e: ApiError) => { this.saving = false; this.publishModalOpen.set(false); this.error = e.userMessage; }
    });
  }

  private finish(status: ComplianceForm['status']) {
    this.saving = false;
    this.saved = true;
    this.status = status;
    this.publishModalOpen.set(false);
    setTimeout(() => this.saved = false, 2500);
    this.afterFirstSave();
    if (status === 'live') this.router.navigate(['/app/my-compliance', this.currentId]);
  }

  /** A new form moves to its own address so a refresh (or the back button) reopens the saved form. */
  private afterFirstSave() {
    if (!this.formId && this.currentId) this.router.navigate(['/app/form-builder', this.currentId], { replaceUrl: true });
  }
}
