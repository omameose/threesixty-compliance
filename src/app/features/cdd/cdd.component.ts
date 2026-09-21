import { Component } from '@angular/core';
import { DueDiligenceComponent } from '../due-diligence/due-diligence.component';

@Component({ selector: 'app-cdd', standalone: true, imports: [DueDiligenceComponent], template: '<app-due-diligence kind="CDD"></app-due-diligence>' })
export class CddComponent {}
