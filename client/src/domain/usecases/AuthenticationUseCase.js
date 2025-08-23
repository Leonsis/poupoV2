import { UserRepository } from '../repositories/UserRepository.js';

export class AuthenticationUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async login(email, password) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      // Verificar se o usuário está banido
      if (user.isBanned) {
        return { success: false, message: 'Usuário banido' };
      }

      // Aqui seria feita a verificação da senha
      // Por enquanto, retornamos sucesso
      return { success: true, user };
    } catch (error) {
      return { success: false, message: 'Erro ao fazer login' };
    }
  }

  async register(userData) {
    try {
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return { success: false, message: 'Email já cadastrado' };
      }

      const newUser = await this.userRepository.create(userData);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, message: 'Erro ao criar conta' };
    }
  }

  async verifyToken(token) {
    try {
      const user = await this.userRepository.verifyToken(token);
      if (!user) {
        return { success: false, message: 'Token inválido' };
      }

      if (user.isBanned) {
        return { success: false, message: 'Usuário banido' };
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, message: 'Erro ao verificar token' };
    }
  }
}
