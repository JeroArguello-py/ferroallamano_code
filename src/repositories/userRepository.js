import User from '../models/usermodel.js';

class UserRepository {
    async findByEmail(email) {
        if (!email) return null;
        return User.findOne({ email: email.toLowerCase().trim() }).lean();
    }

    async create(userData) {
        const created = await User.create(userData);
        return created.toJSON();
    }
}

export default new UserRepository();
