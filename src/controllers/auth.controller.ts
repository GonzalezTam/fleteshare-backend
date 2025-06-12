import { Request, Response } from 'express';
import {
  loginService,
  recoverPasswordService,
  registerService,
  validateTokenService,
} from '@/services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerService(req.body);
    res.status(201).json({ result, message: 'Usuario registrado exitosamente' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginService(req.body);
    res.status(200).json({
      result,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(401).json({ error: message });
  }
};

export const recoverPassword = async (req: Request, res: Response) => {
  try {
    const _ = await recoverPasswordService(req.body);
    const { username } = req.body;
    res
      .status(200)
      .json({ message: `Email de restablecimiento de contraseña enviado a ${username}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    const result = await validateTokenService(req.query.token as string);
    res.status(200).json({ result, message: 'Token válido' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};
