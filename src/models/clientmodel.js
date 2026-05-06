export default class Client {
    constructor({ nombre, documento, telefono, correo, direccion }) {
        this.id = Date.now().toString();
        this.nombre = nombre;
        this.documento = documento;
        this.telefono = telefono;
        this.correo = correo;
        this.direccion = direccion;
        this.createdAt = new Date().toISOString();
    }
}
