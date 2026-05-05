import User from '../models/userModel.js';

class UserRepository {
    constructor() {
        if (UserRepository.instance) {
            return UserRepository.instance;
        }
        
        this.users = [
            new User('tu@empresa.com', '12345678')
        ];
        
        UserRepository.instance = this;
    }

    findByEmail(email) {
        return this.users.find(user => user.email === email);
    }
}

export default new UserRepository();