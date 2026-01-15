import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  email_verified: boolean;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
  login_attempts: number;
  locked_until?: Date;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    full_name: {
      type: String,
      trim: true,
    },
    avatar_url: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    login_attempts: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
    },
    last_login: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ created_at: -1 });
UserSchema.index({ is_active: 1 });

// Virtual to get user without password
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password_hash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
