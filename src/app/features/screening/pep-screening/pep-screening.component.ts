import { Component } from '@angular/core';
import { ScreeningToolComponent } from '../screening-tool.component';

/** Backed by the risk-detection service; see ScreeningToolComponent. */
@Component({
  selector: 'app-pep-screening',
  standalone: true,
  imports: [ScreeningToolComponent],
  template: '<app-screening-tool kind="pep"></app-screening-tool>'
})
export class PepScreeningComponent {}
