import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ComplianceForm, FormQuestion, FormSection, QuestionOption, QuestionType } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { MOCK_FORMS } from '../../core/mock/forms.mock';
import { findTemplate } from '../../core/mock/sectors.mock';

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

  constructor(private data: DataService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    if (this.formId) {
      this.data.getForm(this.formId).subscribe(form => {
        if (form) {
          this.formName = form.name;
          this.formType = form.type;
          this.status = form.status;
          this.sections.set(JSON.parse(JSON.stringify(form.sections)));
        }
      });
      return;
    }

    this.route.queryParamMap.subscribe(params => {
      const templateId = params.get('templateId');
      if (templateId) {
        const res = findTemplate(templateId);
        if (res) {
          this.formName = res.template.name;
          this.formType = res.template.type;
          const source = res.template.type === 'KYB' ? MOCK_FORMS.find(f => f.id === 'form-002')
            : res.template.type === 'AML' ? MOCK_FORMS.find(f => f.id === 'form-004')
            : res.template.type === 'Combined' ? MOCK_FORMS.find(f => f.id === 'form-003')
            : MOCK_FORMS.find(f => f.id === 'form-001');
          this.sections.set(JSON.parse(JSON.stringify(source?.sections || [])));
        }
      } else if (this.sections().length === 0) {
        this.sections.set([{ id: genId('sec'), title: 'Section 1', description: '', questions: [] }]);
      }
    });
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

  save(newStatus: ComplianceForm['status']) {
    this.saving = true;
    const form: ComplianceForm = {
      id: this.formId || genId('form'),
      name: this.formName,
      type: this.formType,
      status: newStatus,
      sections: this.sections(),
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      submissionsCount: 0,
      completedCount: 0,
      pendingReviewCount: 0,
      webhookEnabled: false
    };
    this.data.saveForm(form).subscribe(() => {
      this.saving = false;
      this.saved = true;
      this.status = newStatus;
      this.publishModalOpen.set(false);
      setTimeout(() => this.saved = false, 2500);
      if (!this.formId) this.router.navigate(['/app/my-compliance']);
    });
  }
}
