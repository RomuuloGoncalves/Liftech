import type { Request, Response } from 'express';
import { userService } from './userService.js';

export class userController  {
  constructor(private service: userService) {}

    create = async (req: Request, res: Response) => {
    try {
      const user = await this.service.criarUsuario(req.body);
      return res.status(201).json(user);
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
  };

    getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await this.service.buscarPorId(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    return res.json(user);
  };
  }

