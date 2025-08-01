export interface Repository<T> {
  create(data: T): Promise<string>;
  findById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  update(id: string, data: T): Promise<void>;
  delete(id: string): Promise<void>;
}
