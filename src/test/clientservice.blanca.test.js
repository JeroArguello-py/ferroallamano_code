/**
 * □ CAJA BLANCA · ClientService — cobertura de ramas
 *
 * Cubrimos las decisiones de createClient, getAllClients y searchClients.
 * El repositorio de clientes (la "BD") se mockea con datos controlados.
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const clientRepository = {
    findByDocumento: jest.fn(),
    create: jest.fn(),
    getAll: jest.fn()
};
jest.unstable_mockModule('../repositories/clientRepository.js', () => ({ default: clientRepository }));

const { default: clientService } = await import('../services/clientService.js');

function clienteValido(overrides = {}) {
    return {
        nombre: 'Ana Pérez',
        documento: '111222333',
        telefono: '3001234567',
        correo: 'ana@correo.com',
        direccion: 'Calle 1',
        ...overrides
    };
}

beforeEach(() => {
    clientRepository.findByDocumento.mockResolvedValue(null);
    clientRepository.create.mockImplementation(async (d) => ({ id: 'cli-nuevo', ...d }));
    clientRepository.getAll.mockResolvedValue([]);
});

describe('createClient — ramas (Caja Blanca)', () => {

    test('happy path: crea cliente (201) y normaliza con trim', async () => {
        const r = await clientService.createClient(clienteValido({ nombre: '  Ana Pérez  ', documento: ' 111 ', telefono: undefined }));
        expect(r.statusCode).toBe(201);
        expect(clientRepository.create).toHaveBeenCalledTimes(1);
        const persisted = clientRepository.create.mock.calls[0][0];
        expect(persisted.nombre).toBe('Ana Pérez');
        expect(persisted.documento).toBe('111');
        // telefono ausente → cadena vacía (rama del operador || '')
        expect(persisted.telefono).toBe('');
    });

    test('rama: sin nombre → 400 y NO persiste', async () => {
        const r = await clientService.createClient(clienteValido({ nombre: '' }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/obligatorios/i);
        expect(clientRepository.create).not.toHaveBeenCalled();
    });

    test('rama: sin documento → 400', async () => {
        const r = await clientService.createClient(clienteValido({ documento: '' }));
        expect(r.statusCode).toBe(400);
    });

    test('rama: documento duplicado → 409', async () => {
        clientRepository.findByDocumento.mockResolvedValue({ id: 'otro', documento: '111222333' });
        const r = await clientService.createClient(clienteValido());
        expect(r.statusCode).toBe(409);
        expect(clientRepository.create).not.toHaveBeenCalled();
    });
});

describe('getAllClients', () => {
    test('devuelve todos los clientes con su total', async () => {
        clientRepository.getAll.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
        const r = await clientService.getAllClients();
        expect(r.statusCode).toBe(200);
        expect(r.total).toBe(2);
    });
});

describe('searchClients — ramas de coincidencia (Caja Blanca)', () => {
    const clientes = [
        { id: 'c1', nombre: 'Ana Pérez', documento: '111', correo: 'ana@mail.com' },
        { id: 'c2', nombre: 'Beto Gómez', documento: '222', correo: 'beto@mail.com' },
        { id: 'c3', nombre: 'Carlos Ruiz', documento: '333', correo: 'carlos@mail.com' }
    ];

    beforeEach(() => {
        clientRepository.getAll.mockResolvedValue(clientes);
    });

    test('rama: término vacío devuelve todos', async () => {
        const r = await clientService.searchClients('');
        expect(r.total).toBe(3);
    });

    test('rama: coincide por nombre', async () => {
        const r = await clientService.searchClients('ana');
        expect(r.data.map(c => c.id)).toEqual(['c1']);
    });

    test('rama: coincide por documento', async () => {
        const r = await clientService.searchClients('222');
        expect(r.data.map(c => c.id)).toEqual(['c2']);
    });

    test('rama: coincide por correo', async () => {
        const r = await clientService.searchClients('carlos@');
        expect(r.data.map(c => c.id)).toEqual(['c3']);
    });

    test('sin coincidencias → lista vacía', async () => {
        const r = await clientService.searchClients('inexistente-xyz');
        expect(r.total).toBe(0);
        expect(r.data).toEqual([]);
    });

    test('respeta el límite (slice) y conserva el total real', async () => {
        const r = await clientService.searchClients('', 1);
        expect(r.data).toHaveLength(1); // recortado al límite
        expect(r.total).toBe(3);        // total sin recortar
    });
});
