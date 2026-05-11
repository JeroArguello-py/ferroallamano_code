import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sale from '../models/saleModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_FILE = path.join(__dirname, '..', 'data', 'sales.json');

class SaleRepository {
    constructor() {
        if (SaleRepository.instance) {
            return SaleRepository.instance;
        }
        this.sales = this._loadFromMock();
        SaleRepository.instance = this;
    }

    _loadFromMock() {
        try {
            if (!fs.existsSync(MOCK_FILE)) {
                fs.mkdirSync(path.dirname(MOCK_FILE), { recursive: true });
                fs.writeFileSync(MOCK_FILE, '[]', 'utf-8');
                return [];
            }
            const raw = fs.readFileSync(MOCK_FILE, 'utf-8');
            const data = JSON.parse(raw || '[]').map(s => new Sale(s));
            console.log(`🧾 Mock de ventas cargado: ${data.length} venta(s).`);
            return data;
        } catch (error) {
            console.error('🚨 Error al leer el mock de ventas:', error);
            return [];
        }
    }

    _saveToMock() {
        try {
            fs.writeFileSync(MOCK_FILE, JSON.stringify(this.sales, null, 2), 'utf-8');
            console.log(`💾 Mock de ventas actualizado: ${this.sales.length}.`);
        } catch (error) {
            console.error('🚨 Error al escribir el mock de ventas:', error);
        }
    }

    getAll() {
        return this.sales;
    }

    findById(id) {
        return this.sales.find(s => s.id === id);
    }

    /**
     * Devuelve el siguiente consecutivo del año para construir el código.
     * Formato esperado: VEN-YYYY-NNN
     */
    nextSequenceForYear(year) {
        const prefix = `VEN-${year}-`;
        const used = this.sales
            .map(s => s.codigo || '')
            .filter(c => c.startsWith(prefix))
            .map(c => parseInt(c.slice(prefix.length), 10))
            .filter(n => !Number.isNaN(n));
        const max = used.length ? Math.max(...used) : 0;
        return max + 1;
    }

    create(saleData) {
        const sale = new Sale(saleData);
        this.sales.push(sale);
        this._saveToMock();
        return sale;
    }
}

export default new SaleRepository();
