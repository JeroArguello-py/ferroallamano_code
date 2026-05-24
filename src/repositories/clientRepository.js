import mongoose from 'mongoose';
import Client from '../models/clientmodel.js';
import { serialize, serializeMany } from '../utils/serialize.js';

class ClientRepository {
    async findByDocumento(documento) {
        if (!documento) return null;
        return serialize(await Client.findOne({ documento }).lean());
    }

    async findById(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        return serialize(await Client.findById(id).lean());
    }

    async create(clientData) {
        const created = await Client.create(clientData);
        return created.toJSON();
    }

    async getAll() {
        return serializeMany(await Client.find().sort({ createdAt: -1 }).lean());
    }
}

export default new ClientRepository();
