import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/productModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock JSON que simula la colección de productos en MongoDB
const MOCK_FILE = path.join(__dirname, '..', 'data', 'products.json');

class ProductRepository {
    constructor() {
        if (ProductRepository.instance) {
            return ProductRepository.instance;
        }

        this.products = this._loadFromMock();
        ProductRepository.instance = this;
    }

    // ── Persistencia (mock) ─────────────────────────────────────────────────
    _loadFromMock() {
        try {
            if (!fs.existsSync(MOCK_FILE)) {
                fs.mkdirSync(path.dirname(MOCK_FILE), { recursive: true });
                fs.writeFileSync(MOCK_FILE, '[]', 'utf-8');
                return [];
            }
            const raw = fs.readFileSync(MOCK_FILE, 'utf-8');
            const data = JSON.parse(raw || '[]').map(p => new Product(p));
            console.log(`📦 Mock de productos cargado: ${data.length} producto(s).`);
            return data;
        } catch (error) {
            console.error('🚨 Error al leer el mock de productos:', error);
            return [];
        }
    }

    _saveToMock() {
        try {
            fs.writeFileSync(MOCK_FILE, JSON.stringify(this.products, null, 2), 'utf-8');
            console.log(`💾 Mock de productos actualizado: ${this.products.length}.`);
        } catch (error) {
            console.error('🚨 Error al escribir el mock de productos:', error);
        }
    }

    // ── Interfaz pública ────────────────────────────────────────────────────
    findById(id) {
        return this.products.find(p => p.id === id);
    }

    findBySku(sku) {
        return this.products.find(p => p.sku?.toLowerCase() === sku?.toLowerCase());
    }

    getAll() {
        return this.products;
    }

    create(productData) {
        const product = new Product(productData);
        this.products.push(product);
        this._saveToMock();
        return product;
    }

    update(id, changes) {
        const idx = this.products.findIndex(p => p.id === id);
        if (idx === -1) return null;

        const current = this.products[idx];
        const updated = new Product({
            ...current,
            ...changes,
            id: current.id,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString()
        });

        this.products[idx] = updated;
        this._saveToMock();
        return updated;
    }
}

export default new ProductRepository();
