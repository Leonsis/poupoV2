const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', 'database', 'poupo_final.db');
        this.init();
    }

    // Função para obter data/hora atual no formato correto (fuso horário local)
    getCurrentDateTime() {
        const now = new Date();
        // Usar fuso horário local (Brasil) em vez de UTC
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Função para obter data atual no formato YYYY-MM-DD (fuso horário local)
    getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    async init() {
        try {
            // Criar diretório do banco se não existir
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Erro ao conectar ao banco SQLite:', err.message);
                    process.exit(1);
                } else {
                    console.log('✅ Conectado ao banco SQLite');
                    this.createTables();
                }
            });
        } catch (error) {
            console.error('❌ Erro ao inicializar banco:', error.message);
            process.exit(1);
        }
    }

    async createTables() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                birth_date TEXT,
                phone TEXT,
                gross_salary REAL DEFAULT 0.00,
                dark_mode BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
                is_banned BOOLEAN DEFAULT 0,
                deleted_at DATETIME
            );

            CREATE TABLE IF NOT EXISTS bank_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                account_name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                account_category TEXT NOT NULL DEFAULT 'debito',
                balance REAL DEFAULT 0.00,
                credit_limit REAL DEFAULT 0.00,
                current_debt REAL DEFAULT 0.00,
                closing_date TEXT,
                due_date TEXT,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS income (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                source TEXT NOT NULL,
                income_date TEXT NOT NULL,
                description TEXT,
                bank_account_id INTEGER,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                category TEXT,
                payment_method TEXT NOT NULL,
                card_name TEXT,
                expense_date TEXT NOT NULL,
                bank_account_id INTEGER,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS fixed_expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                due_date TEXT NOT NULL,
                category TEXT,
                is_paid BOOLEAN DEFAULT 0,
                is_bill_or_invoice BOOLEAN DEFAULT 0,
                total_installments INTEGER DEFAULT 1,
                paid_installments INTEGER DEFAULT 0,
                current_installment INTEGER DEFAULT 1,
                is_overdue BOOLEAN DEFAULT 0,
                original_fixed_expense_id INTEGER,
                transition_month_year TEXT,
                bank_account_id INTEGER,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE SET NULL,
                FOREIGN KEY (original_fixed_expense_id) REFERENCES fixed_expenses (id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                bank_account_id INTEGER,
                date TEXT NOT NULL,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS financial_advice (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                advice TEXT NOT NULL,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS monthly_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                month_year TEXT NOT NULL,
                total_income REAL DEFAULT 0,
                total_expenses REAL DEFAULT 0,
                total_fixed_expenses REAL DEFAULT 0,
                total_credit_card_expenses REAL DEFAULT 0,
                balance REAL DEFAULT 0,
                income_details TEXT,
                expenses_details TEXT,
                fixed_expenses_details TEXT,
                credit_card_expenses_details TEXT,
                bank_accounts_summary TEXT,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS user_login_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ip TEXT,
                created_at DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, income_date);
            CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);
            CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user ON fixed_expenses(user_id);
        `;

        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('❌ Erro ao criar tabelas:', err);
                    reject(err);
                } else {
                    console.log('✅ Tabelas criadas com sucesso');
                    resolve();
                }
            });
        });
    }

    async testConnection() {
        return new Promise((resolve) => {
            this.db.get('SELECT 1 as test', (err, row) => {
                if (err) {
                    console.error('❌ Erro no teste de conexão:', err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Erro na query:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Erro na query get:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Erro na query run:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async transaction(callback) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                try {
                    const result = callback(this);
                    this.db.run('COMMIT');
                    resolve(result);
                } catch (error) {
                    this.db.run('ROLLBACK');
                    reject(error);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Erro ao fechar banco:', err);
                    } else {
                        console.log('✅ Banco fechado com sucesso');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new Database();
