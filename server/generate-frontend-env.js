// Gera client/.env.local com o IP local do backend
const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const ip = getLocalIP();
const envPath = path.join(__dirname, '../client/.env.local');
const envContent = `REACT_APP_API_URL=http://${ip}:5000\n`;
fs.writeFileSync(envPath, envContent);
console.log(`Arquivo .env.local gerado para o frontend: REACT_APP_API_URL=http://${ip}:5000`);
