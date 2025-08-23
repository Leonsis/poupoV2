import { User } from '../entities/User.js';

export class UserRepository {
  async create(userData) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async banUser(id) {
    throw new Error('Method not implemented');
  }

  async unbanUser(id) {
    throw new Error('Method not implemented');
  }

  async getAllUsers() {
    throw new Error('Method not implemented');
  }

  async verifyToken(token) {
    throw new Error('Method not implemented');
  }
}
