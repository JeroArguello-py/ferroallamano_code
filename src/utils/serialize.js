/**
 * Normaliza documentos planos devueltos por consultas .lean() de Mongoose.
 *
 * Mongoose con .lean() devuelve `_id` (ObjectId) y NO incluye los virtuals
 * (como `id`) a menos que se use el plugin mongoose-lean-virtuals. El resto
 * del proyecto (frontend incluido) espera un campo `id` string, por eso aqui
 * convertimos `_id` -> `id` de forma consistente.
 */
export function serialize(doc) {
    if (!doc || typeof doc !== 'object') return doc;
    const obj = { ...doc };
    if (obj._id !== undefined && obj._id !== null) {
        obj.id = String(obj._id);
        delete obj._id;
    }
    delete obj.__v;
    return obj;
}

export function serializeMany(docs) {
    return (docs || []).map(serialize);
}
