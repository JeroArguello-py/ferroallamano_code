import mongoose from 'mongoose';

export const ESTADO_FACTURA = Object.freeze({
    BORRADOR: 'borrador',
    EMITIDA: 'emitida'
});

export const ESTADO_PAGO = Object.freeze({
    PENDIENTE: 'pendiente',
    PAGADO: 'pagado'
});

const facturaItemSchema = new mongoose.Schema(
    {
        productId: { type: String, default: '' },
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

const facturaSchema = new mongoose.Schema(
    {
        codigoFactura: { type: String, required: true, unique: true, index: true },
        ventaId: { type: String, required: true, unique: true, index: true },
        codigoVenta: { type: String, default: '' },
        fechaEmision: { type: Date, default: Date.now },
        clienteId: { type: String, default: '' },
        clienteSnapshot: clienteSnapshotSchema,
        items: { type: [facturaItemSchema], default: [] },
        subtotal: { type: Number, default: 0 },
        descuento: { type: Number, default: 0 },
        descuentoPorcentaje: { type: Number, default: 0 },
        ivaRate: { type: Number, default: 0.19 },
        iva: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        notas: { type: String, default: '' },
        estadoFactura: {
            type: String,
            enum: Object.values(ESTADO_FACTURA),
            default: ESTADO_FACTURA.BORRADOR
        },
        estadoPago: {
            type: String,
            enum: Object.values(ESTADO_PAGO),
            default: ESTADO_PAGO.PENDIENTE
        }
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

facturaSchema.virtual('id').get(function () {
    return this._id.toString();
});

const Factura = mongoose.model('Factura', facturaSchema);

export default Factura;
