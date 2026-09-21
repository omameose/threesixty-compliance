import { Component } from '@angular/core';
import { VerificationChecksComponent } from '../verification-checks.component';

/** Backed by the real verification service; see VerificationChecksComponent. */
@Component({
  selector: 'app-document-verification',
  standalone: true,
  imports: [VerificationChecksComponent],
  template: '<app-verification-checks kind="document"></app-verification-checks>'
})
export class DocumentVerificationComponent {}
