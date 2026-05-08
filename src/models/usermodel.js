// Roles válidos del sistema
export const ROLES = Object.freeze({
    USER: 'user',
    ADMIN: 'admin'
});

export default class User {
    constructor(email, password, role = ROLES.USER) {
        this.email = email;
        this.password = password;
        this.role = role;
    }

    isAdmin() {
        return this.role === ROLES.ADMIN;
    }
}
