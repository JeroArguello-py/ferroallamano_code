import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/router.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Límite ampliado para permitir imágenes en base64 dentro del JSON.
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: false, limit: '8mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', router);

const PORT = process.env.PORT || 3000;

// Durante las pruebas (NODE_ENV === 'test', que Jest define automáticamente)
// NO conectamos a MongoDB ni abrimos un puerto: Supertest usa la `app`
// directamente y los repositorios se mockean. Así la app es importable y
// testeable sin depender de una base de datos real.
if (process.env.NODE_ENV !== 'test') {
    // Conectar primero a MongoDB y luego levantar el servidor
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    });
}

export default app;
