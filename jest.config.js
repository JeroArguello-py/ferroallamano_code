/**
 * Configuración de Jest para un proyecto en ES Modules ("type": "module").
 *
 * Puntos clave:
 *  - transform: {}  -> desactiva Babel para usar el soporte NATIVO de ESM de Node.
 *    Por eso los scripts de package.json arrancan Jest con
 *    `node --experimental-vm-modules`.
 *  - El mockeo de módulos en ESM se hace con `jest.unstable_mockModule(...)`
 *    ANTES de importar dinámicamente el módulo bajo prueba (ver los .test.js).
 */
export default {
    testEnvironment: 'node',

    // Sin transformaciones: ejecutamos ESM nativo.
    transform: {},

    // Solo buscamos pruebas dentro de src/test.
    testMatch: ['**/src/test/**/*.test.js'],

    // Métricas de cobertura: nos interesa sobre todo la lógica de negocio.
    collectCoverageFrom: [
        'src/services/**/*.js',
        'src/models/**/*.js',
        'src/middlewares/**/*.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'text-summary', 'html'],

    // Silencia el ruido de console.error que algunos controladores emiten
    // en las ramas de error (los tests siguen verificando el comportamiento).
    clearMocks: true,
    verbose: true
};
