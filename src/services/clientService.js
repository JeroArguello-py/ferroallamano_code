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
}

export default new ClientService();
