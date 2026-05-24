import productRepository from '../repositories/productRepository.js';
import { CATEGORIES } from '../models/productModel.js';

class ProductService {
    // ── Lectura con filtros / búsqueda / orden ───────────────────────────────
    async listProducts(query = {}) {
        let items = await productRepository.getAll();

        if (query.nombre) {
            const term = query.nombre.toString().toLowerCase().trim();
            items = items.filter(p => p.nombre.toLowerCase().includes(term));
        }

        if (query.sku) {
            const term = query.sku.toString().toLowerCase().trim();
            items = items.filter(p => (p.sku || '').toLowerCase().includes(term));
        }

        const min = query.precioMin !== undefined && query.precioMin !== '' ? Number(query.precioMin) : null;
        const max = query.precioMax !== undefined && query.precioMax !== '' ? Number(query.precioMax) : null;
        if (min !== null && !Number.isNaN(min)) items = items.filter(p => p.precio >= min);
        if (max !== null && !Number.isNaN(max)) items = items.filter(p => p.precio <= max);

        if (query.disponibilidad === 'stock') {
            items = items.filter(p => p.stock > 0);
        } else if (query.disponibilidad === 'agotado') {
            items = items.filter(p => p.stock <= 0);
        }

        const sort = query.sort || 'nombre';
        const dir = query.dir === 'desc' ? -1 : 1;
        items = [...items].sort((a, b) => {
            const av = a[sort];
            const bv = b[sort];
            if (typeof av === 'number') return (av - bv) * dir;
            return String(av).localeCompare(String(bv), 'es') * dir;
        });

        return {
            success: true,
            statusCode: 200,
            data: items,
            total: items.length
        };
    }

    async getProduct(id) {
        const product = await productRepository.findById(id);
        if (!product) {
            return { success: false, statusCode: 404, message: 'Producto no encontrado.' };
        }
        return { success: true, statusCode: 200, data: product };
    }

    async createProduct(payload) {
        const errors = this._validate(payload);
        if (errors.length) {
            return { success: false, statusCode: 400, message: errors.join(' ') };
        }

        if (await productRepository.findBySku(payload.sku)) {
            return { success: false, statusCode: 409, message: 'Ya existe un producto con ese SKU.' };
        }

        const created = await productRepository.create({
            nombre: payload.nombre.trim(),
            sku: payload.sku.trim(),
            categoria: payload.categoria,
            precio: Number(payload.precio),
            stock: Number(payload.stock),
            descripcion: (payload.descripcion || '').trim(),
            imagen: payload.imagen || ''
        });

        return {
            success: true,
            statusCode: 201,
            message: 'Producto registrado exitosamente.',
            data: created
        };
    }

    async updateProduct(id, payload) {
        const current = await productRepository.findById(id);
        if (!current) {
            return { success: false, statusCode: 404, message: 'Producto no encontrado.' };
        }

        const merged = { ...current, ...payload };
        const errors = this._validate(merged);
        if (errors.length) {
            return { success: false, statusCode: 400, message: errors.join(' ') };
        }

        if (payload.sku && payload.sku !== current.sku) {
            const dup = await productRepository.findBySku(payload.sku);
            if (dup && dup.id !== id) {
                return { success: false, statusCode: 409, message: 'Ya existe un producto con ese SKU.' };
            }
        }

        const updated = await productRepository.update(id, {
            nombre: merged.nombre?.trim(),
            sku: merged.sku?.trim(),
            categoria: merged.categoria,
            precio: Number(merged.precio),
            stock: Number(merged.stock),
            descripcion: (merged.descripcion || '').trim(),
            imagen: merged.imagen || ''
        });

        return {
            success: true,
            statusCode: 200,
            message: 'Producto actualizado.',
            data: updated
        };
    }

    getCategories() {
        return CATEGORIES;
    }

    _validate(payload) {
        const errors = [];
        if (!payload.nombre || !String(payload.nombre).trim()) errors.push('El nombre es obligatorio.');
        if (!payload.sku || !String(payload.sku).trim()) errors.push('El SKU es obligatorio.');
        if (!payload.categoria) errors.push('La categoría es obligatoria.');
        if (payload.precio === undefined || payload.precio === '' || Number(payload.precio) < 0) {
            errors.push('El precio debe ser un número mayor o igual a 0.');
        }
        if (payload.stock === undefined || payload.stock === '' || Number(payload.stock) < 0) {
            errors.push('El stock debe ser un número mayor o igual a 0.');
        }
        if (payload.categoria && !CATEGORIES.includes(payload.categoria)) {
            errors.push('Categoría inválida.');
        }
        // Imagen es opcional, pero si viene validamos formato y tamaño.
        if (payload.imagen) {
            const img = String(payload.imagen);
            const formatoOk = img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://');
            if (!formatoOk) errors.push('La imagen no tiene un formato válido.');
            if (img.length > 7500000) errors.push('La imagen es demasiado grande (máx ~5MB).');
        }
        return errors;
    }
}

export default new ProductService();
