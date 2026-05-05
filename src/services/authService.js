import userRepository from '../repositories/userRepository.js';

class AuthService {
    authenticate(email, password) {
        const user = userRepository.findByEmail(email);
        
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        if (user.password === password) {
            return { success: true, message: 'Inicio de sesión exitoso' };
        } else {
            return { success: false, message: 'Contraseña incorrecta' };
        }
    }
}

export default new AuthService();