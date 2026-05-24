import mongoose from 'mongoose';

// Roles válidos del sistema
export const ROLES = Object.freeze({
    USER: 'user',
    ADMIN: 'admin'
});

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.USER
        }
    },
    {
        timestamps: true,
        toJSON: {
            versionKey: false,
            transform: (_, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.password; // nunca expongas el password en JSON
                return ret;
            }
        }
    }
);

userSchema.methods.isAdmin = function () {
    return this.role === ROLES.ADMIN;
};

const User = mongoose.model('User', userSchema);

export default User;
