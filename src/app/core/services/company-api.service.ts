import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../http/api.service';
import { CompanyProfile, TeamMember, TeamRoleInfo, TeamRoleLevel } from '../models/models';

interface MemberDto {
  userId: string; name: string; email: string; photoUrl?: string; roleLevel: TeamRoleLevel; roleName: string;
  status: TeamMember['status']; owner: boolean; invitedAt?: string; lastLoginAt?: string;
}

/** A team member as the Teams screen shows them; `owner` cannot be changed or removed. */
export interface Member extends TeamMember { owner: boolean; }

interface ProfileDto {
  id: string; name: string; legalName?: string; logoUrl?: string; brandColor?: string; website?: string; supportEmail?: string;
  address?: string; industry?: string; country?: string; verified: boolean; createdAt: string;
}

const day = (iso?: string) => (iso ?? '').slice(0, 10);

/** company-service and account-service calls about the signed-in user's own company: its team and its profile. */
@Injectable({ providedIn: 'root' })
export class CompanyApiService {
  constructor(private api: ApiService) {}

  roles(): Observable<TeamRoleInfo[]> {
    return this.api.get('/team/roles');
  }

  members(): Observable<Member[]> {
    return this.api.get<MemberDto[]>('/team/members').pipe(map(list => list.map(m => ({
      id: m.userId, name: m.name, email: m.email, avatarUrl: m.photoUrl ?? '', role: m.roleLevel, status: m.status, owner: m.owner,
      invitedAt: day(m.invitedAt), lastActive: m.lastLoginAt ? day(m.lastLoginAt) : '—'
    }))));
  }

  invite(body: { email: string; firstName?: string; lastName?: string; roleLevel: number; jobTitle?: string }): Observable<unknown> {
    return this.api.post('/team/invitations', body);
  }

  resendInvitation(userId: string): Observable<unknown> {
    return this.api.post(`/team/members/${userId}/resend-invitation`);
  }

  changeRole(userId: string, roleLevel: number): Observable<unknown> {
    return this.api.put(`/team/members/${userId}/role`, { roleLevel });
  }

  setStatus(userId: string, status: 'active' | 'suspended'): Observable<unknown> {
    return this.api.put(`/team/members/${userId}/status`, { status });
  }

  remove(userId: string): Observable<unknown> {
    return this.api.delete(`/team/members/${userId}`);
  }

  profile(): Observable<CompanyProfile> {
    return this.api.get<ProfileDto>('/company/profile').pipe(map(toProfile));
  }

  saveProfile(p: CompanyProfile): Observable<CompanyProfile> {
    return this.api.put<ProfileDto>('/company/profile', {
      name: p.name, legalName: p.legalName || undefined, logoUrl: p.logoUrl || undefined, brandColor: p.brandColor || undefined,
      website: p.website || undefined, supportEmail: p.supportEmail || undefined, address: p.address || undefined, country: p.country || undefined
    }).pipe(map(toProfile));
  }
}

const toProfile = (d: ProfileDto): CompanyProfile => ({
  id: d.id, name: d.name, legalName: d.legalName ?? '', logoUrl: d.logoUrl ?? '', brandColor: d.brandColor ?? '#128a4d', website: d.website ?? '',
  supportEmail: d.supportEmail ?? '', address: d.address ?? '', industry: d.industry ?? '', country: d.country ?? '', verified: d.verified,
  createdAt: day(d.createdAt)
});
