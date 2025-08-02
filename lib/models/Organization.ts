import mongoose from 'mongoose';

export interface IOrganization extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo?: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  settings: {
    allowPublicSignup: boolean;
    requireEmailVerification: boolean;
    defaultRole: 'user' | 'admin';
  };
  subscription: {
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
    plan: string;
    seats: number;
    usedSeats: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialStart?: Date;
    trialEnd?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new mongoose.Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allow null but enforce uniqueness when present
  },
  description: {
    type: String,
    maxlength: 500,
  },
  logo: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  settings: {
    allowPublicSignup: {
      type: Boolean,
      default: false,
    },
    requireEmailVerification: {
      type: Boolean,
      default: true,
    },
    defaultRole: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  subscription: {
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'unpaid'],
      default: 'trialing',
    },
    plan: {
      type: String,
      default: 'healthcare_compliance',
    },
    seats: {
      type: Number,
      default: 5,
    },
    usedSeats: {
      type: Number,
      default: 1,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

// Indexes
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ domain: 1 }, { sparse: true, unique: true });
OrganizationSchema.index({ owner: 1 });
OrganizationSchema.index({ members: 1 });

// Pre-save middleware to generate slug
OrganizationSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
