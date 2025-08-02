import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  image?: string;
  role: 'user' | 'admin';
  organization?: mongoose.Types.ObjectId | null; // Made optional and nullable
  provider: 'credentials' | 'google' | 'github';
  emailVerified?: Date;
  stripeCustomerId?: string;
  subscription?: {
    id: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
    plan: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialStart?: Date;
    trialEnd?: Date;
  };
  trialEndsAt?: Date;
  notificationSettings?: {
    emailNotifications: boolean;
    taskReminders: boolean;
    documentExpiration: boolean;
    systemUpdates: boolean;
    weeklyReports: boolean;
  };
  securitySettings?: {
    twoFactorEnabled: boolean;
    sessionTimeout: string;
    passwordExpiry: string;
    requirePasswordChange: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      select: false,
    },
    image: String,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: false, // Allow users to be created without organization initially
    },
    provider: {
      type: String,
      enum: ['credentials', 'google', 'github'],
      default: 'credentials',
    },
    emailVerified: Date,
    stripeCustomerId: String,
    subscription: {
      id: String,
      status: {
        type: String,
        enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      },
      plan: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      trialStart: Date,
      trialEnd: Date,
    },
    trialEndsAt: Date,
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
      documentExpiration: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: false },
      weeklyReports: { type: Boolean, default: true },
    },
    securitySettings: {
      twoFactorEnabled: { type: Boolean, default: false },
      sessionTimeout: { type: String, default: '24' },
      passwordExpiry: { type: String, default: '90' },
      requirePasswordChange: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Remove duplicate email index since it's already unique: true
UserSchema.index({ stripeCustomerId: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;