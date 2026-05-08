import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Client from '../models/clientmodel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta del archivo mock que simula la base de datos
const MOCK_FILE = path.join(__dirname, '..', 'data', 'clients.json');

class ClientRepository {
    constructor() {
        if (ClientRepository.instance) {
            return ClientRepository.instance;
        }

        // Cargar clientes desde el mock al iniciar
        this.clients = this._loadFromMock();
        ClientRepository.instance = this;
    }

    // ── Métodos privados de persistencia (mock) ──────────────────────────────
    _loadFromMock() {
        try {
            if (!fs.existsSync(MOCK_FILE)) {
                // Si el archivo no existe, lo creamos vacío
                fs.mkdirSync(path.dirname(MOCK_FILE), { recursive: true });
                fs.writeFileSync(MOCK_FILE, '[]', 'utf-8');
                return [];
            }

            const raw = fs.readFileSync(MOCK_FILE, 'utf-8');
            const data = JSON.parse(raw || '[]');
            console.log(`📂 Mock cargado: ${data.length} cliente(s) en memoria.`);
            return data;
        } catch (error) {
            console.error('🚨 Error al leer el mock de clientes:', error);
            return [];
        }
    }

    _saveToMock() {
        try {
            fs.writeFileSync(MOCK_FILE, JSON.stringify(this.clients, null, 2), 'utf-8');
            console.log(`💾 Mock actualizado: ${this.clients.length} cliente(s) guardado(s).`);
        } catch (error) {
            console.error('🚨 Error al escribir en el mock de clientes:', error);
        }
    }

    // ── Interfaz pública del repositorio ─────────────────────────────────────
    findByDocumento(documento) {
        return this.clients.find(client => client.documento === documento);
    }

    findById(id) {
        return this.clients.find(client => client.id === id);
    }

    create(clientData) {
        const newClient = new Client(clientData);
        this.clients.push(newClient);
        this._saveToMock();
        return newClient;
    }

    getAll() {
        return this.clients;
    }
}

export default new ClientRepository();
