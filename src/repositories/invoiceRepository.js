import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Invoice from '../models/invoiceModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_FILE = path.join(__dirname, '..', 'data', 'invoices.json');

class InvoiceRepository {
    constructor() {
        if (InvoiceRepository.instance) return InvoiceRepository.instance;
        this.invoices = this._loadFromMock();
        InvoiceRepository.instance = this;
    }

    _loadFromMock() {
        try {
            if (!fs.existsSync(MOCK_FILE)) {
                fs.mkdirSync(path.dirname(MOCK_FILE), { recursive: true });
                fs.writeFileSync(MOCK_FILE, '[]', 'utf-8');
                return [];
            }
            const raw = fs.readFileSync(MOCK_FILE, 'utf-8');
            const data = JSON.parse(raw || '[]').map(i => new Invoice(i));
            console.log(`🧾 Mock de facturas cargado: ${data.length} factura(s).`);
            return data;
        } catch (err) {
            console.error('🚨 Error al leer el mock de facturas:', err);
            return [];
        }
    }

    _saveToMock() {
        try {
            fs.writeFileSync(MOCK_FILE, JSON.stringify(this.invoices, null, 2), 'utf-8');
            console.log(`💾 Mock de facturas actualizado: ${this.invoices.length}.`);
        } catch (err) {
            console.error('🚨 Error al escribir el mock de facturas:', err);
        }
    }

    getAll() { return this.invoices; }

    findById(id) { return this.invoices.find(i => i.id === id); }

    findBySaleId(saleId) { return this.invoices.find(i => i.saleId === saleId); }

    /** Consecutivo de factura del año, formato FAC-YYYY-NNNN. */
    nextSequenceForYear(year) {
        const prefix = `FAC-${year}-`;
        const used = this.invoices
            .map(i => i.codigo || '')
            .filter(c => c.startsWith(prefix))
            .map(c => parseInt(c.slice(prefix.length), 10))
            .filter(n => !Number.isNaN(n));
        const max = used.length ? Math.max(...used) : 0;
        return max + 1;
    }

    create(invoiceData) {
        const invoice = new Invoice(invoiceData);
        this.invoices.push(invoice);
        this._saveToMock();
        return invoice;
    }

    update(id, changes) {
        const idx = this.invoices.findIndex(i => i.id === id);
        if (idx === -1) return null;
        const current = this.invoices[idx];
        const updated = new Invoice({ ...current, ...changes, id: current.id, createdAt: current.createdAt });
        this.invoices[idx] = updated;
        this._saveToMock();
        return updated;
    }
}

export default new InvoiceRepository();
