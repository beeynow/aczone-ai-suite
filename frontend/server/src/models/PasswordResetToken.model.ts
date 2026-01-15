import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordResetToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

// TTL index to automatically delete expired tokens
PasswordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  'PasswordResetToken',
  PasswordResetTokenSchema
);
