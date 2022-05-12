export interface IBaseRepository<T, createDto, updateDto> {
  create(createDto: createDto): Promise<T>;
  findAll(): Promise<T[]>;
  findOne(id: string): Promise<T>;
  update(id: string, updateDto: updateDto): Promise<T>;
  remove(id: string): Promise<T>;
}
