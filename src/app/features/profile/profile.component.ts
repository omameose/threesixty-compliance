import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
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

  error = '';

  save() {
    if (!this.user) return;
    this.saving = true;
    this.error = '';
    this.auth.updateProfile({ firstName: this.user.firstName, lastName: this.user.lastName, phone: this.user.phone }).subscribe({
      next: () => {
        this.saving = false;
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: (e: ApiError) => {
        this.saving = false;
        this.error = e.userMessage;
      }
    });
  }
}
