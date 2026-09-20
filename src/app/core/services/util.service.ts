import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from '../http/api.service';

export interface SectorOption {
  key: string;
  name: string;
  industries: string[];
}

export interface IndustryOptions {
  /** Industries grouped by sector, for a grouped drop-down. */
  sectors: SectorOption[];
  /** The same industries as one sorted list ending in "Other". */
  industries: string[];
}

export interface CountryOption {
  code: string;
  name: string;
}

/** Reference data for the sign-up drop-downs. Public endpoints, fetched once per page load. */
@Injectable({ providedIn: 'root' })
export class UtilService {
  readonly industries$: Observable<IndustryOptions> = this.api.get<IndustryOptions>('/public/util/industries').pipe(shareReplay(1));
  readonly countries$: Observable<CountryOption[]> = this.api.get<CountryOption[]>('/public/util/countries').pipe(shareReplay(1));

  constructor(private api: ApiService) {}
}
