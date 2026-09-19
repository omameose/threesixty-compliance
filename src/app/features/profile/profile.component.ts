import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { AppUser, TeamRoleInfo } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, AvatarComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user?: AppUser;
  roles: TeamRoleInfo[] = [];
  saving = false;
  saved = signal(false);

  constructor(public auth: AuthService, private data: DataService) {}

  ngOnInit() {
    this.user = { ...this.auth.currentUser()! };
    this.data.getTeamRoles().subscribe(r => this.roles = r);
  }

  roleName() {
    return this.roles.find(r => r.level === this.user?.role)?.name || '';
  }

  save() {
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.saved.set(true);
      if (this.user) this.auth.completeLogin(this.user);
      setTimeout(() => this.saved.set(false), 2500);
    }, 500);
  }
}
