import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires_at: Date;
  revoked: boolean;
  replaced_by?: string;
  device_info?: string;
  created_at: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
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
    revoked: {
      type: Boolean,
      default: false,
    },
    replaced_by: {
      type: String,
    },
    device_info: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

// Indexes
RefreshTokenSchema.index({ user_id: 1, token: 1 });
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
