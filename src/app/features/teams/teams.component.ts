import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { TeamMember, TeamRoleInfo, TeamRoleLevel } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, AvatarComponent, ModalComponent],
  templateUrl: './teams.component.html'
})
export class TeamsComponent implements OnInit {
  members: TeamMember[] = [];
  roles: TeamRoleInfo[] = [];
  loading = true;
  inviteModalOpen = signal(false);
  removeTarget = signal<TeamMember | null>(null);
  rolesLegendOpen = signal(false);

  inviteEmail = '';
  inviteRole: TeamRoleLevel = 1;
  inviting = false;

  constructor(private data: DataService) {}

  ngOnInit() {
    this.data.getTeamRoles().subscribe(r => { this.roles = r; this.inviteRole = 1; });
    this.data.getTeam().subscribe(m => { this.members = m; this.loading = false; });
  }

  roleName(level: TeamRoleLevel) {
    return this.roles.find(r => r.level === level)?.name || 'Level ' + level;
  }

  invite() {
    if (!this.inviteEmail.trim()) return;
    this.inviting = true;
    const name = this.inviteEmail.split('@')[0].replace(/[._]/g, ' ');
    const member: TeamMember = {
      id: 'tm-' + Date.now(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: this.inviteEmail,
      avatarUrl: '',
      role: this.inviteRole,
      status: 'invited',
      invitedAt: new Date().toISOString().slice(0, 10),
      lastActive: '—'
    };
    this.data.inviteMember(member).subscribe(() => {
      this.inviting = false;
      this.inviteModalOpen.set(false);
      this.inviteEmail = '';
      this.data.getTeam().subscribe(m => this.members = m);
    });
  }

  updateRole(member: TeamMember, role: string) {
    this.data.updateMemberRole(member.id, Number(role) as TeamRoleLevel).subscribe(() => {
      this.data.getTeam().subscribe(m => this.members = m);
    });
  }

  confirmRemove() {
    const target = this.removeTarget();
    if (!target) return;
    this.data.removeMember(target.id).subscribe(() => {
      this.removeTarget.set(null);
      this.data.getTeam().subscribe(m => this.members = m);
    });
  }
}
