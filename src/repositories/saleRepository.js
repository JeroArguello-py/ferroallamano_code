import mongoose from 'mongoose';
import Sale from '../models/saleModel.js';
import { serialize, serializeMany } from '../utils/serialize.js';

class SaleRepository {
    async getAll() {
        return serializeMany(await Sale.find().sort({ createdAt: -1 }).lean());
    }

    async findById(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        return serialize(await Sale.findById(id).lean());
    }

    /**
     * Siguiente consecutivo del anio para construir el codigo VEN-AAAA-NNN.
     */
    async nextSequenceForYear(year) {
        const prefix = `VEN-${year}-`;
        const docs = await Sale.find({ codigo: { $regex: `^${prefix}` } })
            .select('codigo')
            .lean();

        const used = docs
            .map(d => d.codigo || '')
            .map(c => parseInt(c.slice(prefix.length), 10))
            .filter(n => !Number.isNaN(n));

        const max = used.length ? Math.max(...used) : 0;
        return max + 1;
    }

    async create(saleData) {
        const created = await Sale.create(saleData);
        return created.toJSON();
    }
}

export default new SaleRepository();
