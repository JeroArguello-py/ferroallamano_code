import saleRepository from '../repositories/saleRepository.js';
import productRepository from '../repositories/productRepository.js';
import clientRepository from '../repositories/clientRepository.js';

const PALETA = {
    'Herramientas Eléctricas': '#9c5220',
    'Tornillería': '#f9bc1d',
    'Pinturas y Acabados': '#1c6ea4',
    'Plomería': '#0ea5e9',
    'Construcción': '#64748b',
    'Otros': '#9ca3af'
};

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function pctCambio(actual, previo) {
    if (!previo) return actual > 0 ? 100 : 0;
    return +(((actual - previo) / previo) * 100).toFixed(1);
}

class DashboardService {
    /**
     * Calcula indicadores reales a partir de las ventas, productos y clientes.
     */
    async getResumen() {
        const [sales, products, clients] = await Promise.all([
            saleRepository.getAll(),
            productRepository.getAll(),
            clientRepository.getAll()
        ]);

        const totalVendido = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const transacciones = sales.length;
        const promedio = transacciones ? totalVendido / transacciones : 0;

        // Hoy vs ayer
        const hoy = startOfDay(new Date());
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);

        let totalHoy = 0, totalAyer = 0, txHoy = 0, txAyer = 0;
        for (const s of sales) {
            const f = startOfDay(s.fecha || s.createdAt || new Date());
            if (f.getTime() === hoy.getTime()) { totalHoy += Number(s.total) || 0; txHoy++; }
            else if (f.getTime() === ayer.getTime()) { totalAyer += Number(s.total) || 0; txAyer++; }
        }

        // Ingresos por categoría (uniendo cada ítem con la categoría de su producto)
        const catPorId = new Map(products.map(p => [p.id, p.categoria]));
        const totalesCat = {};
        for (const s of sales) {
            for (const it of (s.items || [])) {
                const cat = catPorId.get(it.productId) || 'Otros';
                totalesCat[cat] = (totalesCat[cat] || 0) + (Number(it.subtotal) || 0);
            }
        }
        const sumaCat = Object.values(totalesCat).reduce((a, b) => a + b, 0);
        const categorias = Object.entries(totalesCat)
            .map(([name, val]) => ({
                name,
                val,
                percentage: sumaCat ? Math.round((val / sumaCat) * 100) : 0,
                color: PALETA[name] || '#9ca3af'
            }))
            .sort((a, b) => b.val - a.val)
            .slice(0, 5);

        return {
            totalVendido,
            transacciones,
            promedio,
            totalHoy,
            totalAyer,
            txHoy,
            txAyer,
            trendTotal: pctCambio(totalHoy, totalAyer),
            trendTx: pctCambio(txHoy, txAyer),
            productosActivos: products.filter(p => (Number(p.stock) || 0) > 0).length,
            productosTotal: products.length,
            clientes: clients.length,
            categorias
        };
    }
}

export default new DashboardService();
