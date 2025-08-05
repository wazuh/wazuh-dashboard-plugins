export interface CreateRepository<Entity, CreateEntityDTO> {
  create(data: CreateEntityDTO): Promise<Entity>;
}

export interface UpdateRepository<
  Entity,
  UpdateEntityDTO = Partial<Exclude<Entity, 'id'>>,
> {
  update(id: string, data: UpdateEntityDTO): Promise<Entity>;
}

export interface FindRepository<Entity> {
  findById(id: string): Promise<Entity | null>;
}

export interface GetAllRepository<Entity> {
  getAll(): Promise<Entity[]>;
}

export interface DeleteRepository {
  delete(id: string): Promise<void>;
}
