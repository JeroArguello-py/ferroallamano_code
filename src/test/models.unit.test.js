import Client from '../models/clientmodel.js';
import Product, { CATEGORIES } from '../models/productModel.js';
import Factura from '../models/facturaModel.js';
import Sale, { SaleItem } from '../models/saleModel.js';
import User, { ROLES } from '../models/usermodel.js';

describe('Client model', () => {
    test('setters trim and toJSON transform', () => {
        const c = new Client({ nombre: ' Ana ', documento: ' 12345 ', correo: 'TEST@EXAMPLE.COM ' });
        const asJson = c.toJSON();
        expect(asJson.nombre).toBe('Ana');
        expect(asJson.documento).toBe('12345');
        expect(asJson.correo).toBe('test@example.com');
        expect(typeof asJson.id).toBe('string');
    });
});

describe('Product model', () => {
    test('isAvailable true when stock > 0 and categories exported', () => {
        const p = new Product({ nombre: 'Taladro', sku: 'T-1', categoria: CATEGORIES[0], precio: 100, stock: 2 });
        expect(p.isAvailable()).toBe(true);
        const p2 = new Product({ nombre: 'Screw', sku: 'S-1', categoria: CATEGORIES[0], precio: 1, stock: 0 });
        expect(p2.isAvailable()).toBe(false);
        expect(Array.isArray(CATEGORIES)).toBe(true);
        expect(CATEGORIES.length).toBeGreaterThan(0);
    });

    test('virtual id getter and toJSON transform for Product', () => {
        const p = new Product({ nombre: 'Martillo', sku: 'M-1', categoria: CATEGORIES[0], precio: 10, stock: 1 });
        expect(p.id).toBe(p._id.toString());
        const json = p.toJSON();
        expect(json._id).toBeUndefined();
        expect(json.id).toBe(p._id.toString());
    });
});

describe('Factura model', () => {
    test('defaults and enums', () => {
        const f = new Factura({ codigoFactura: 'F-1', ventaId: 'V-1' });
        const json = f.toJSON();
        expect(json.estadoFactura).toBeDefined();
        expect(json.estadoPago).toBeDefined();
        expect(typeof json.id).toBe('string');
    });
});

describe('SaleItem helper', () => {
    test('subtotal calculation and rounding', () => {
        const item = new SaleItem({ productId: 'p1', sku: 's1', nombre: 'n', cantidad: 2, precioUnitario: 9.995 });
        expect(item.subtotal).toBe(19.99);
    });
});

describe('User model', () => {
    test('isAdmin and toJSON hides password', () => {
        const u = new User({ email: 'Admin@X.COM ', password: 'secret', role: ROLES.ADMIN });
        expect(u.isAdmin()).toBe(true);
        const json = u.toJSON();
        expect(json.password).toBeUndefined();
        expect(json.email).toBe('admin@x.com');
    });
});

describe('Sale model', () => {
    test('virtual id getter and toJSON transform for Sale', () => {
        const s = new Sale({ codigo: 'S-1', clienteId: 'C-1' });
        expect(s.id).toBe(s._id.toString());
        const json = s.toJSON();
        expect(json._id).toBeUndefined();
        expect(json.id).toBe(s._id.toString());
    });
});
