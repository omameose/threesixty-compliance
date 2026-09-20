import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { CompanyApiService, Member } from '../../core/services/company-api.service';
import { TeamRoleInfo, TeamRoleLevel } from '../../core/models/models';
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
  members: Member[] = [];
  roles: TeamRoleInfo[] = [];
  loading = true;
  inviteModalOpen = signal(false);
  removeTarget = signal<Member | null>(null);
  rolesLegendOpen = signal(false);
  error = signal('');
  notice = signal('');

  inviteEmail = '';
  inviteFirstName = '';
  inviteLastName = '';
  inviteRole: TeamRoleLevel = 1;
  inviting = false;

  constructor(private team: CompanyApiService) {}

  ngOnInit() {
    this.team.roles().subscribe({ next: r => { this.roles = r; this.inviteRole = 1; }, error: (e: ApiError) => this.fail(e) });
    this.load();
  }

  private load() {
    this.team.members().subscribe({ next: m => { this.members = m; this.loading = false; }, error: (e: ApiError) => this.fail(e) });
  }

  private fail(e: ApiError) {
    this.loading = false;
    this.error.set(e.userMessage);
  }

  roleName(level: TeamRoleLevel) {
    return this.roles.find(r => r.level === level)?.name || 'Level ' + level;
  }

  /** Runs a change, then reloads the list so what is shown is what the server holds. */
  private run(call: import('rxjs').Observable<unknown>, success: string, done?: () => void) {
    this.error.set('');
    this.notice.set('');
    call.subscribe({
      next: () => { done?.(); this.notice.set(success); this.load(); },
      error: (e: ApiError) => { done?.(); this.error.set(e.userMessage); this.load(); }
    });
  }

  invite() {
    const email = this.inviteEmail.trim();
    if (!email) return;
    this.inviting = true;
    this.run(this.team.invite({ email, firstName: this.inviteFirstName.trim() || undefined, lastName: this.inviteLastName.trim() || undefined, roleLevel: Number(this.inviteRole) }),
      `Invitation sent to ${email}.`, () => {
        this.inviting = false;
        this.inviteModalOpen.set(false);
        this.inviteEmail = this.inviteFirstName = this.inviteLastName = '';
      });
  }

  updateRole(member: Member, role: string) {
    this.run(this.team.changeRole(member.id, Number(role)), `${member.name} is now ${this.roleName(Number(role) as TeamRoleLevel)}.`);
  }

  resend(member: Member) {
    this.run(this.team.resendInvitation(member.id), `A new invitation was sent to ${member.email}.`);
  }

  toggleSuspend(member: Member) {
    const suspend = member.status === 'active';
    this.run(this.team.setStatus(member.id, suspend ? 'suspended' : 'active'), suspend ? `${member.name} was suspended.` : `${member.name} can sign in again.`);
  }

  confirmRemove() {
    const target = this.removeTarget();
    if (!target) return;
    this.run(this.team.remove(target.id), `${target.name} was removed.`, () => this.removeTarget.set(null));
  }
}
