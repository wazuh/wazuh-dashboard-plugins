export function keysOf<T, K extends keyof T>(obj: T): K[] {
    return Object.keys(obj) as K[];
}

export interface CommonProps {
    className?: string;
    'aria-label'?: string;
    'data-test-subj'?: string;
  }