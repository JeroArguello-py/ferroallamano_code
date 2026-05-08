import User, { ROLES } from '../models/usermodel.js';

class UserRepository {
    constructor() {
        if (UserRepository.instance) {
            return UserRepository.instance;
        }

        // Usuarios sembrados (mock). Cuando se migre a MongoDB
        // este arreglo se reemplaza por una colección de la base.
        this.users = [
            new User('tu@empresa.com', '12345678', ROLES.USER),
            new User('admin@ferroallamano.com', 'admin1234', ROLES.ADMIN)
        ];

        UserRepository.instance = this;
    }

    findByEmail(email) {
        return this.users.find(user => user.email === email);
    }
}

export default new UserRepository();
