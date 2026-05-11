import clientRepository from '../repositories/clientRepository.js';

class ClientService {
    createClient(payload) {
        const { nombre, documento, telefono, correo, direccion } = payload;

        if (!nombre || !documento) {
            return {
                success: false,
                statusCode: 400,
                message: 'Nombre y documento son obligatorios.'
            };
        }

        const existingClient = clientRepository.findByDocumento(documento);
        if (existingClient) {
            return {
                success: false,
                statusCode: 409,
                message: 'Ya existe un cliente con ese documento.'
            };
        }

        const createdClient = clientRepository.create({
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

    getAllClients() {
        const clients = clientRepository.getAll();
        return {
            success: true,
            statusCode: 200,
            data: clients,
            total: clients.length
        };
    }

    /**
     * Búsqueda flexible (autocompletar) por nombre, documento o correo.
     * `q` es el término de búsqueda; vacío devuelve todo (limitado).
     */
    searchClients(q, limit = 8) {
        const term = (q || '').toString().trim().toLowerCase();
        const all = clientRepository.getAll();
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
