import { Component } from '@angular/core';
import { ScreeningToolComponent } from '../screening-tool.component';

/** Backed by the risk-detection service; see ScreeningToolComponent. */
@Component({
  selector: 'app-adverse-media',
  standalone: true,
  imports: [ScreeningToolComponent],
  template: '<app-screening-tool kind="adverse-media"></app-screening-tool>'
})
export class AdverseMediaComponent {}
