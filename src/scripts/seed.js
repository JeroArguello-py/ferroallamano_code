/**
 * Script de seed: inserta usuarios base y migra los datos
 * existentes en `src/data/*.json` a la colección de MongoDB.
 *
 * Uso:
 *   npm run seed
 *
 * Es idempotente: usa `updateOne(... { upsert: true })` para no duplicar
 * registros si lo corres varias veces.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User, { ROLES } from '../models/usermodel.js';
import Client from '../models/clientmodel.js';
import Product from '../models/productModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(file) {
    const fullPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(fullPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf-8') || '[]');
    } catch {
        return [];
    }
}

async function seedUsers() {
    const users = [
        { email: 'tu@empresa.com', password: '12345678', role: ROLES.USER },
        { email: 'admin@ferroallamano.com', password: 'admin1234', role: ROLES.ADMIN }
    ];

    for (const u of users) {
        await User.updateOne(
            { email: u.email },
            { $setOnInsert: u },
            { upsert: true }
        );
    }
    console.log(`👤 Usuarios sembrados: ${users.length}`);
}

async function seedClients() {
    const json = readJson('clients.json');
    if (!json.length) {
        console.log('📂 No hay clientes en JSON para migrar.');
        return;
    }
    let inserted = 0;
    for (const c of json) {
        const exists = await Client.findOne({ documento: c.documento });
        if (!exists) {
            await Client.create({
                nombre: c.nombre,
                documento: c.documento,
                telefono: c.telefono || '',
                correo: c.correo || '',
                direccion: c.direccion || ''
            });
            inserted++;
        }
    }
    console.log(`📂 Clientes migrados: ${inserted}/${json.length}`);
}

async function seedProducts() {
    const json = readJson('products.json');
    if (!json.length) {
        console.log('📦 No hay productos en JSON para migrar.');
        return;
    }
    let inserted = 0;
    for (const p of json) {
        const exists = await Product.findOne({ sku: p.sku });
        if (!exists) {
            await Product.create({
                nombre: p.nombre,
                sku: p.sku,
                categoria: p.categoria,
                precio: Number(p.precio) || 0,
                stock: Number(p.stock) || 0,
                descripcion: p.descripcion || ''
            });
            inserted++;
        }
    }
    console.log(`📦 Productos migrados: ${inserted}/${json.length}`);
}

async function run() {
    await connectDB();
    try {
        await seedUsers();
        await seedClients();
        await seedProducts();
        console.log('✅ Seed completado.');
    } catch (error) {
        console.error('❌ Error en el seed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

run();
