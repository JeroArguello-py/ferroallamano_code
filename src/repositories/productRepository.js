import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import { serialize, serializeMany } from '../utils/serialize.js';

function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ProductRepository {
    async findById(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        return serialize(await Product.findById(id).lean());
    }

    async findBySku(sku) {
        if (!sku) return null;
        return serialize(await Product.findOne({
            sku: { $regex: `^${escapeRegExp(sku)}$`, $options: 'i' }
        }).lean());
    }

    async getAll() {
        return serializeMany(await Product.find().sort({ nombre: 1 }).lean());
    }

    async create(productData) {
        const created = await Product.create(productData);
        return created.toJSON();
    }

    async update(id, changes) {
        if (!mongoose.isValidObjectId(id)) return null;
        return serialize(await Product.findByIdAndUpdate(
            id,
            { $set: changes },
            { new: true, runValidators: true }
        ).lean());
    }
}

export default new ProductRepository();
