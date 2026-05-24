import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true, trim: true },
        documento: { type: String, required: true, trim: true, unique: true, index: true },
        telefono: { type: String, default: '', trim: true },
        correo: { type: String, default: '', trim: true, lowercase: true },
        direccion: { type: String, default: '', trim: true }
    },
    {
        timestamps: true, // createdAt / updatedAt automáticos
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

// `id` virtual para compatibilidad con el código existente
clientSchema.virtual('id').get(function () {
    return this._id.toString();
});

const Client = mongoose.model('Client', clientSchema);

export default Client;
