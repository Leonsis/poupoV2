/**
 * Utilitários para manipulação de datas com fuso horário local (Brasil) - Frontend
 */

// Função para obter data/hora atual no formato correto (fuso horário local)
export function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Função para obter data atual no formato YYYY-MM-DD (fuso horário local)
export function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Função para formatar data para YYYY-MM-DD (fuso horário local)
export function formatDateToLocal(date) {
    if (!date) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Função para formatar data/hora para YYYY-MM-DD HH:MM:SS (fuso horário local)
export function formatDateTimeToLocal(date) {
    if (!date) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Função para obter timestamp ISO com fuso horário local
export function getLocalISOString() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString();
}

// Função para obter data de hoje no formato brasileiro
export function getTodayBrazilian() {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    });
}

// Função para obter hora atual no formato brasileiro
export function getCurrentTimeBrazilian() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour12: false
    });
}

// Função para formatar data para exibição no formato brasileiro
export function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    });
}

// Função para formatar data/hora para exibição no formato brasileiro
export function formatDateTimeForDisplay(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    });
}
