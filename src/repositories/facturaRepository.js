import mongoose from 'mongoose';
import Factura from '../models/facturaModel.js';
import { serialize, serializeMany } from '../utils/serialize.js';

class FacturaRepository {
    async getAll() {
        return serializeMany(await Factura.find().sort({ createdAt: -1 }).lean());
    }

    async findById(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        return serialize(await Factura.findById(id).lean());
    }

    async findByVentaId(ventaId) {
        if (!ventaId) return null;
        return serialize(await Factura.findOne({ ventaId }).lean());
    }

    /**
     * Siguiente consecutivo del anio para construir el codigo FAC-AAAA-NNNN.
     */
    async nextSequenceForYear(year) {
        const prefix = `FAC-${year}-`;
        const docs = await Factura.find({ codigoFactura: { $regex: `^${prefix}` } })
            .select('codigoFactura')
            .lean();

        const used = docs
            .map(d => d.codigoFactura || '')
            .map(c => parseInt(c.slice(prefix.length), 10))
            .filter(n => !Number.isNaN(n));

        const max = used.length ? Math.max(...used) : 0;
        return max + 1;
    }

    async create(data) {
        const created = await Factura.create(data);
        return created.toJSON();
    }

    async update(id, changes) {
        if (!mongoose.isValidObjectId(id)) return null;
        return serialize(await Factura.findByIdAndUpdate(
            id,
            { $set: changes },
            { new: true, runValidators: true }
        ).lean());
    }
}

export default new FacturaRepository();
