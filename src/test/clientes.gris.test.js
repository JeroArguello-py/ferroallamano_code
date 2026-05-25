import request from 'supertest';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const clientRepository = {
    findByDocumento: jest.fn(),
    create: jest.fn(),
    getAll: jest.fn()
};

jest.unstable_mockModule('../repositories/clientRepository.js', () => ({ default: clientRepository }));

const { default: app } = await import('../app.js');

beforeEach(() => {
    clientRepository.findByDocumento.mockResolvedValue(null);
    clientRepository.create.mockImplementation(async (d) => ({ id: 'cli-nuevo', ...d }));
    clientRepository.getAll.mockResolvedValue([
        { id: 'cli-1', nombre: 'Ana', documento: '123' },
        { id: 'cli-2', nombre: 'Luis', documento: '456' }
    ]);
});

describe('POST /api/clientes — creación', () => {
    test('happy path crea cliente y persiste', async () => {
        const res = await request(app).post('/api/clientes').send({ nombre: ' Juan ', documento: ' 789 ' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(clientRepository.create).toHaveBeenCalledTimes(1);
        expect(clientRepository.create.mock.calls[0][0].nombre).toBe('Juan');
    });

    test('sin nombre o documento -> 400 y no persiste', async () => {
        const res = await request(app).post('/api/clientes').send({ nombre: '', documento: '' });
        expect(res.status).toBe(400);
        expect(clientRepository.create).not.toHaveBeenCalled();
    });

    test('documento duplicado -> 409', async () => {
        clientRepository.findByDocumento.mockResolvedValue({ id: 'cli-1', documento: '111' });
        const res = await request(app).post('/api/clientes').send({ nombre: 'X', documento: '111' });
        expect(res.status).toBe(409);
    });
});

describe('GET /api/clientes — listado y búsqueda', () => {
    test('GET devuelve todos los clientes', async () => {
        const res = await request(app).get('/api/clientes');
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(2);
    });

    test('search q=term limita resultados', async () => {
        const res = await request(app).get('/api/clientes?q=ana&limit=1');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.total).toBe(1);
    });
});
