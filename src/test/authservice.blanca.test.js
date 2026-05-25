/**
 * □ CAJA BLANCA · AuthService.authenticate — cobertura de ramas
 *
 * Conocemos el código: hay 3 caminos posibles. Diseñamos un test por cada uno.
 * Mockeamos el repositorio de usuarios (la "BD") con datos controlados.
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const userRepository = { findByEmail: jest.fn() };
jest.unstable_mockModule('../repositories/userRepository.js', () => ({ default: userRepository }));

const { default: authService } = await import('../services/authService.js');

const USUARIO = { email: 'admin@ferroallamano.com', password: 'admin1234', role: 'admin' };

beforeEach(() => {
    userRepository.findByEmail.mockResolvedValue(USUARIO);
});

describe('authenticate — ramas (Caja Blanca)', () => {

    test('rama: usuario no encontrado → success false', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        const r = await authService.authenticate('nadie@x.com', 'loquesea');
        expect(r.success).toBe(false);
        expect(r.message).toMatch(/no encontrado/i);
        expect(r.user).toBeUndefined();
    });

    test('rama: contraseña incorrecta → success false', async () => {
        const r = await authService.authenticate(USUARIO.email, 'clave-equivocada');
        expect(r.success).toBe(false);
        expect(r.message).toMatch(/contraseña/i);
        expect(r.user).toBeUndefined();
    });

    test('rama: credenciales correctas → success true con email y rol', async () => {
        const r = await authService.authenticate(USUARIO.email, USUARIO.password);
        expect(r.success).toBe(true);
        expect(r.message).toMatch(/exitoso/i);
        expect(r.user).toEqual({ email: USUARIO.email, role: 'admin' });
        // El servicio NO debe exponer la contraseña en la respuesta.
        expect(r.user.password).toBeUndefined();
    });
});
