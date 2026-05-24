import mongoose from 'mongoose';

// Categorías válidas (alineadas con las del dashboard)
export const CATEGORIES = Object.freeze([
    'Herramientas Eléctricas',
    'Tornillería',
    'Pinturas y Acabados',
    'Plomería',
    'Construcción',
    'Otros'
]);

const productSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true, trim: true },
        sku: { type: String, required: true, trim: true, unique: true, index: true },
        categoria: { type: String, required: true, enum: CATEGORIES },
        precio: { type: Number, required: true, min: 0, default: 0 },
        stock: { type: Number, required: true, min: 0, default: 0 },
        descripcion: { type: String, default: '', trim: true },
        // Imagen del producto en formato data URL base64 (o URL externa). Opcional.
        imagen: { type: String, default: '' }
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

productSchema.virtual('id').get(function () {
    return this._id.toString();
});

productSchema.methods.isAvailable = function () {
    return this.stock > 0;
};

const Product = mongoose.model('Product', productSchema);

export default Product;
