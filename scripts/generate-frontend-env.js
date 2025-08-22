// Script para gerar .env.local com todos os IPs possíveis para o frontend React
const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

const ips = getLocalIPs();
const envLines = [];

// Configuração da API
if (ips.length === 0) {
    envLines.push('# Nenhum IP local encontrado. Use localhost por padrão.');
    envLines.push('REACT_APP_API_URL=http://localhost:5000');
} else {
    envLines.push('# Escolha o IP abaixo que corresponde ao backend acessível na sua rede local:');
    ips.forEach((ip, idx) => {
        const prefix = idx === 0 ? '' : '# ';
        envLines.push(`${prefix}REACT_APP_API_URL=http://${ip}:5000`);
    });
    envLines.push('# Ou use localhost para desenvolvimento local:');
    envLines.push('# REACT_APP_API_URL=http://localhost:5000');
}

// Configuração do dev server
envLines.push('');
envLines.push('# Configuração do dev server');
envLines.push('HOST=0.0.0.0'); // 🔹 Força acesso externo
envLines.push('PORT=3002');
envLines.push('DANGEROUSLY_DISABLE_HOST_CHECK=true'); // ⚡ Necessário para Linux

const envPath = path.join(__dirname, '../client/.env.local');
fs.writeFileSync(envPath, envLines.join('\n'));

console.log('Arquivo .env.local gerado em client/.env.local com os IPs locais possíveis.');