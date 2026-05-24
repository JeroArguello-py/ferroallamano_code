import mongoose from 'mongoose';
import dns from 'dns';

// Fix DNS para Atlas (mongodb+srv://)
// Algunas redes (WiFi de casa/empresa, ISP, VPN) bloquean las consultas DNS SRV
// que necesita el driver para resolver el cluster de Atlas. Forzamos a Node a
// usar DNS publicos (Google + Cloudflare) para garantizar que funcionen.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    if (!MONGODB_URI) {
        console.error(
            'Falta la variable de entorno MONGODB_URI.\n' +
            '   Crea un archivo `.env` en la raiz del proyecto basado en `.env.example`.'
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            family: 4
        });
        const { host, name } = mongoose.connection;
        console.log(`Conectado a MongoDB -> host: ${host} | db: ${name}`);
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
        if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
            console.error(
                '\nPista: parece un problema de DNS al resolver el cluster de Atlas.\n' +
                '   - Verifica tu conexion a internet.\n' +
                '   - Si estas en una red corporativa/universitaria, prueba con otra red o un hotspot.\n' +
                '   - En Atlas -> Network Access asegurate de tener tu IP (o 0.0.0.0/0) permitida.\n'
            );
        }
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        console.warn('Conexion a MongoDB perdida');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('Reconectado a MongoDB');
    });
};

export default connectDB;
