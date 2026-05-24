import clientRepository from '../repositories/clientRepository.js';

class ClientService {
    async createClient(payload) {
        const { nombre, documento, telefono, correo, direccion } = payload;

        if (!nombre || !documento) {
            return {
                success: false,
                statusCode: 400,
                message: 'Nombre y documento son obligatorios.'
            };
        }

        const existingClient = await clientRepository.findByDocumento(documento.trim());
        if (existingClient) {
            return {
                success: false,
                statusCode: 409,
                message: 'Ya existe un cliente con ese documento.'
            };
        }

        const createdClient = await clientRepository.create({
            nombre: nombre.trim(),
            documento: documento.trim(),
            telefono: (telefono || '').trim(),
            correo: (correo || '').trim(),
            direccion: (direccion || '').trim()
        });

        return {
            success: true,
            statusCode: 201,
            message: 'Cliente registrado exitosamente.',
            data: createdClient
        };
    }

    async getAllClients() {
        const clients = await clientRepository.getAll();
        return {
            success: true,
            statusCode: 200,
            data: clients,
            total: clients.length
        };
    }

    /**
     * Búsqueda flexible (autocompletar) por nombre, documento o correo.
     */
    async searchClients(q, limit = 8) {
        const term = (q || '').toString().trim().toLowerCase();
        const all = await clientRepository.getAll();
        const matches = term
            ? all.filter(c =>
                (c.nombre || '').toLowerCase().includes(term) ||
                (c.documento || '').toLowerCase().includes(term) ||
                (c.correo || '').toLowerCase().includes(term)
            )
            : all;

        return {
            success: true,
            statusCode: 200,
            data: matches.slice(0, limit),
            total: matches.length
        };
    }
}

export default new ClientService();
