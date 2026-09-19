import { Component, Input, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const ICONS: Record<string, string> = {
  dashboard: '<path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/>',
  templates: '<path d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v4h-7v-4Zm0 6h7v4h-7v-4Z"/>',
  'form-builder': '<path d="M4 5h16M4 5v14a1 1 0 0 0 1 1h9M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M9 10h6M9 14h3" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M15 17l1.5 1.5L20 15" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  compliance: '<path d="M12 2 4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3Z" fill="none" stroke-width="1.8"/><path d="m9 12 2 2 4-4" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  clients: '<path d="M17 20h5v-1a4 4 0 0 0-4-4h-1M9 20H4v-1a4 4 0 0 1 4-4h2m0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0 0-6" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3Z" fill="none" stroke-width="1.8" stroke-linejoin="round"/>',
  'user-check': '<circle cx="9" cy="8" r="3.2" fill="none" stroke-width="1.8"/><path d="M3.5 20a5.7 5.7 0 0 1 11 0M16 11l2 2 3.5-3.5" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'id-card': '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke-width="1.8"/><circle cx="8.5" cy="11" r="1.8" fill="none" stroke-width="1.6"/><path d="M6 16h5M14 9.5h4M14 13h4" stroke-width="1.6" stroke-linecap="round"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke-width="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" fill="none" stroke-width="1.8"/>',
  'file-check': '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6Z" fill="none" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 2v6h5M9.5 15l1.8 1.8L15 13" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  gauge: '<path d="M4.5 18a8 8 0 1 1 15 0" fill="none" stroke-width="1.8" stroke-linecap="round"/><path d="M12 12l3-3" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="1.3"/>',
  'users-check': '<circle cx="8" cy="8" r="3" fill="none" stroke-width="1.8"/><path d="M2.5 20a5.7 5.7 0 0 1 11 0" fill="none" stroke-width="1.8" stroke-linecap="round"/><path d="m14 15 2 2 4.5-4.5" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" fill="none" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke-width="1.8"/>',
  code: '<path d="m9 8-4 4 4 4M15 8l4 4-4 4" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  users: '<circle cx="9" cy="8" r="3.2" fill="none" stroke-width="1.8"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16.5 8.2a3 3 0 1 1 0 6M21 20a5.7 5.7 0 0 0-4.5-5.6" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
  'credit-card': '<rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke-width="1.8"/><path d="M2.5 10h19M6 15h4" stroke-width="1.8" stroke-linecap="round"/>',
  settings: '<circle cx="12" cy="12" r="3" fill="none" stroke-width="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.5 15a1.7 1.7 0 0 0-1.55-1H2.9a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.5 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 6.93 4.24l.06.06A1.7 1.7 0 0 0 8.86 4.64 1.7 1.7 0 0 0 9.86 3.1V3a2 2 0 1 1 4 0v.09c0 .69.4 1.3 1 1.55.62.25 1.34.12 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.25.62.86 1.02 1.55 1.02H21a2 2 0 1 1 0 4h-.09c-.69 0-1.3.4-1.51 1Z" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  user: '<circle cx="12" cy="8" r="3.5" fill="none" stroke-width="1.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="m16 17 5-5-5-5M21 12H9" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke-width="1.8"/><path d="m21 21-4.35-4.35" stroke-width="1.8" stroke-linecap="round"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.7 21a2 2 0 0 1-3.4 0" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"/>',
  upload: '<path d="M12 3v12m0-12 4 4m-4-4-4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="M20 6 9 17l-5-5" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  'check-circle': '<circle cx="12" cy="12" r="9" fill="none" stroke-width="1.8"/><path d="m8.5 12.5 2.3 2.3L16 10" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M18 6 6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>',
  'x-circle': '<circle cx="12" cy="12" r="9" fill="none" stroke-width="1.8"/><path d="m9 9 6 6m0-6-6 6" stroke-width="1.8" stroke-linecap="round"/>',
  'alert-triangle': '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="none" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v4M12 17h.01" stroke-width="1.8" stroke-linecap="round"/>',
  'more-vertical': '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
  edit: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6h14Z" fill="none" stroke-width="1.7" stroke-linejoin="round"/>',
  link: '<path d="M9 17H7A5 5 0 0 1 7 7h2m6 10h2a5 5 0 0 0 0-10h-2M8 12h8" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2" fill="none" stroke-width="1.7"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke-width="1.7"/>',
  'arrow-left': '<path d="M19 12H5m0 0 7 7m-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-right': '<path d="M5 12h14m0 0-7-7m7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16" stroke-width="2" stroke-linecap="round"/>',
  building: '<path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M4 21h16m-6 0v-4h-4v4M9 7h.01M9 11h.01M14 7h.01M14 11h.01M19 21V10l-5-3" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  heart: '<path d="M12 21s-7-4.4-9.7-9C.6 8.6 2 5 5.5 4.3 8 3.8 10 5 12 7.5 14 5 16 3.8 18.5 4.3 22 5 23.4 8.6 21.7 12 19 16.6 12 21 12 21Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  'academic-cap': '<path d="m2 8 10-5 10 5-10 5-10-5Zm4 2.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5M22 8v6" fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>',
  sprout: '<path d="M12 22V13m0 0c0-4-3-7-8-7 0 5 3 7 8 7Zm0 0c0-3.5 2.5-6 7-6 0 4.5-3 6-7 6Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  truck: '<rect x="1" y="7" width="13" height="10" rx="1" fill="none" stroke-width="1.6"/><path d="M14 10h4l3 3v4h-3" fill="none" stroke-width="1.6" stroke-linejoin="round"/><circle cx="6" cy="18.5" r="1.6" fill="none" stroke-width="1.4"/><circle cx="16.5" cy="18.5" r="1.6" fill="none" stroke-width="1.4"/>',
  'shopping-bag': '<path d="M6 8h12l1 13H5L6 8Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke-width="1.6"/>',
  bank: '<path d="M3 10h18M4 10v9m4-9v9m4-9v9m4-9v9m4-9v9M2 21h20M12 2 2 8h20L12 2Z" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
  webhook: '<path d="M8 12a4 4 0 1 0-3.5 4M16 12a4 4 0 1 1 3.5 4M12 8a4 4 0 0 1 3.9 3.2M8.6 16.8A4 4 0 0 0 12 19" fill="none" stroke-width="1.6" stroke-linecap="round"/>',
  key: '<circle cx="8" cy="15" r="4" fill="none" stroke-width="1.7"/><path d="m10.8 12.2 8.7-8.7 2 2-2 2 2 2-3 3-2-2-2.2 2.2" fill="none" stroke-width="1.7" stroke-linejoin="round"/>',
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke-width="1.8"/><path d="M12 11v5.5M12 8h.01" stroke-width="1.9" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="9" fill="none" stroke-width="1.7"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" fill="none" stroke-width="1.5"/>',
  clock: '<circle cx="12" cy="12" r="9" fill="none" stroke-width="1.7"/><path d="M12 7v5l3.5 2" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  filter: '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5L4 5Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="1.5" fill="none" stroke-width="1.6"/><rect x="13" y="3" width="8" height="8" rx="1.5" fill="none" stroke-width="1.6"/><rect x="3" y="13" width="8" height="8" rx="1.5" fill="none" stroke-width="1.6"/><rect x="13" y="13" width="8" height="8" rx="1.5" fill="none" stroke-width="1.6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke-width="2" stroke-linecap="round"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke-width="1.6"/><path d="m3 6 9 7 9-7" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2Z" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke-width="1.7"/><path d="M8 10V7a4 4 0 1 1 8 0v3" fill="none" stroke-width="1.7"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  send: '<path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  sparkles: '<path d="M12 3v4M12 17v4M5 12H1m22 0h-4M6.3 6.3 3.5 3.5M17.7 17.7l2.8 2.8M17.7 6.3l2.8-2.8M6.3 17.7l-2.8 2.8" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="none" stroke-width="1.6"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z" fill="none" stroke-width="1.5" stroke-linejoin="round"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke-width="1.7"/><path d="M3 10h18M8 3v4M16 3v4" stroke-width="1.7" stroke-linecap="round"/>',
  flag: '<path d="M5 21V4m0 1 4-1 4 1.5 4-1.5 2 .5v10l-2-.5-4 1.5-4-1.5-4 1" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 18h2M8 18h12M4 12h6M14 12h6" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="none" stroke-width="1.6"/><circle cx="6" cy="18" r="2" fill="none" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="none" stroke-width="1.6"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="none" stroke-width="1.6"/><rect x="9" y="9" width="6" height="6" fill="none" stroke-width="1.4"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" stroke-width="1.5" stroke-linecap="round"/>',
  activity: '<path d="M2 12h4l2.5 7 5-14 2.5 7H22" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  network: '<circle cx="6" cy="6" r="2.3" fill="none" stroke-width="1.5"/><circle cx="18" cy="6" r="2.3" fill="none" stroke-width="1.5"/><circle cx="12" cy="18" r="2.3" fill="none" stroke-width="1.5"/><path d="m7.8 7.3 3 8.7m5.4-8.7-3 8.7M8.3 6h7.4" stroke-width="1.4" stroke-linecap="round"/>',
  smartphone: '<rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke-width="1.6"/><path d="M11 18h2" stroke-width="1.8" stroke-linecap="round"/>',
  newspaper: '<path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 1-1.7.7L4 4Z" fill="none" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="7" width="12" height="13" rx="1" fill="none" stroke-width="1.6"/><path d="M6 11h6M6 14h6M6 17h4" stroke-width="1.4" stroke-linecap="round"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0L5 7Zm14 0-3 6a3 3 0 0 0 6 0l-3-6Z" fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>',
  store: '<path d="M3 9v11h18V9M3 9l1.5-5h15L21 9M3 9h18M9 20v-6h6v6" fill="none" stroke-width="1.5" stroke-linejoin="round"/>'
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" [innerHTML]="svg"></svg>`,
  styles: [':host { display: inline-flex; line-height: 0; }']
})
export class IconComponent {
  @Input() name = 'info';
  @Input() size = 20;
  svg: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    const path = ICONS[this.name] || ICONS['info'];
    this.svg = this.sanitizer.bypassSecurityTrustHtml(path);
  }

  ngOnInit() {
    this.ngOnChanges();
  }
}
