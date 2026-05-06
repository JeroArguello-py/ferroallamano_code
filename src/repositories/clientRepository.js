import Client from '../models/clientmodel.js';

class ClientRepository {
    constructor() {
        if (ClientRepository.instance) {
            return ClientRepository.instance;
        }

        this.clients = [];
        ClientRepository.instance = this;
    }

    findByDocumento(documento) {
        return this.clients.find(client => client.documento === documento);
    }

    create(clientData) {
        const newClient = new Client(clientData);
        this.clients.push(newClient);
        return newClient;
    }

    getAll() {
        return this.clients;
    }
}

export default new ClientRepository();
