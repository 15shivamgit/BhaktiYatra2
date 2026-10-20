import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const passwordResetSchema = new mongoose.Schema(
  { tokenHash: { type: String, required: true }, expiresAt: { type: Date, required: true } },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    phone: { type: String },
    role: { type: String, enum: ROLES, default: 'user', required: true },
    isActive: { type: Boolean, default: true, required: true },
    emailVerifiedAt: { type: Date },
    lastLoginAt: { type: Date },
    sessionVersion: { type: Number, default: 0, required: true },
    passwordReset: { type: passwordResetSchema, select: false },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'passwordReset.tokenHash': 1 }, { sparse: true });

/**
 * Public representation sent to clients (docs/03-database/02-models.md).
 * `hasPassword` is only accurate when the document was loaded with `+passwordHash`.
 * @param {any} user
 */
export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    hasPassword: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleId),
    createdAt: user.createdAt,
  };
}

/** Admin view adds account-state fields; still never exposes secrets. */
export function toAdminUser(user) {
  return {
    ...toPublicUser(user),
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    updatedAt: user.updatedAt,
  };
}

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
