import mongoose from 'mongoose';

export const IVA_RATE = 0.19;

const saleItemSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true },
        sku: { type: String, default: '' },
        nombre: { type: String, required: true },
        descripcion: { type: String, default: '' },
        cantidad: { type: Number, required: true, min: 0 },
        precioUnitario: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const clienteSnapshotSchema = new mongoose.Schema(
    {
        nombre: String,
        documento: String,
        telefono: String,
        correo: String,
        direccion: String
    },
    { _id: false }
);

const saleSchema = new mongoose.Schema(
    {
        codigo: { type: String, required: true, unique: true, index: true },
        fecha: { type: Date, default: Date.now },
        clienteId: { type: String, required: true },
        clienteSnapshot: clienteSnapshotSchema,
        items: { type: [saleItemSchema], default: [] },
        notas: { type: String, default: '' },
        subtotal: { type: Number, default: 0 },
        iva: { type: Number, default: 0 },
        descuento: { type: Number, default: 0 },
        descuentoPorcentaje: { type: Number, default: 0, min: 0, max: 100 },
        total: { type: Number, default: 0 }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (_, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

saleSchema.virtual('id').get(function () {
    return this._id.toString();
});

// Helper para construir un item con su subtotal calculado.
export class SaleItem {
    constructor({ productId, sku, nombre, descripcion, cantidad, precioUnitario }) {
        this.productId = productId;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion || '';
        this.cantidad = Number(cantidad) || 0;
        this.precioUnitario = Number(precioUnitario) || 0;
        this.subtotal = +(this.cantidad * this.precioUnitario).toFixed(2);
    }
}

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
