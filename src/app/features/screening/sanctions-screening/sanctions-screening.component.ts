import { Component } from '@angular/core';
import { ScreeningToolComponent } from '../screening-tool.component';

/** Backed by the risk-detection service; see ScreeningToolComponent. */
@Component({
  selector: 'app-sanctions-screening',
  standalone: true,
  imports: [ScreeningToolComponent],
  template: '<app-screening-tool kind="sanctions"></app-screening-tool>'
})
export class SanctionsScreeningComponent {}
