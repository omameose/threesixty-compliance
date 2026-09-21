import { Component } from '@angular/core';
import { DueDiligenceComponent } from '../due-diligence/due-diligence.component';

@Component({ selector: 'app-edd', standalone: true, imports: [DueDiligenceComponent], template: '<app-due-diligence kind="EDD"></app-due-diligence>' })
export class EddComponent {}
