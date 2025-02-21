import { TFilter, IFilterManagerService } from './types';

export class FilterManagerService implements IFilterManagerService {
  private userFilters: TFilter[] = [];
  private fixedFilters: TFilter[] = [];

  getAllFilters(): TFilter[] {
    return [...this.userFilters, ...this.fixedFilters];
  }

  setUserFilters(filters: TFilter[]): void {
    this.userFilters = filters;
  }

  clearUserFilters(): void {
    this.userFilters = [];
  }

  getUserFilters(): TFilter[] {
    return this.userFilters;
  }

  setFixedFilters(filters: TFilter[]): void {
    this.fixedFilters = filters;
  }

  clearFixedFilters(): void {
    this.fixedFilters = [];
  }

  getFixedFilters(): TFilter[] {
    return this.fixedFilters;
  }
}
