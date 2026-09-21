export class CoreRepository <T> {
    async findAll(): Promise <T[]> {
        return [];
    }

    async create(data: T): Promise<T> {
        return data;
    }

    async update(data: Partial<T>): Promise<T> {
        return data as T;
    }

    async delete(id: number): Promise<void>{
        
    }
}