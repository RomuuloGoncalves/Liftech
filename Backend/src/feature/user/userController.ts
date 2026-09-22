import { Request, Response } from 'express';
import { userService } from './userService';

export class userController extends userService {
  constructor(nome: string, role: string, db: any) {
    super(nome, role, db);
  }

  create = async (req: Request, res: Response) => {
    try {
      const user = await this.criarUsuario(req.body);
      return res.status(201).json(user);
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
  };

  getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await this.buscarPorId(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    return res.json(user);
  };
}