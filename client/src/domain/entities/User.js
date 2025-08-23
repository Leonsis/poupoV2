export class User {
  constructor(id, name, email, createdAt, deletedAt, isBanned) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = createdAt;
    this.deletedAt = deletedAt;
    this.isBanned = isBanned;
  }

  static fromJSON(json) {
    return new User(
      json.id,
      json.name,
      json.email,
      json.created_at,
      json.deleted_at,
      json.is_banned
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_at: this.createdAt,
      deleted_at: this.deletedAt,
      is_banned: this.isBanned
    };
  }
}
