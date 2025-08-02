import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user', 'viewer'],
    default: 'user',
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending',
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  acceptedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for cleanup
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for multi-field lookups (token already has unique index)
InvitationSchema.index({ email: 1, organization: 1 });

const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', InvitationSchema);

export default Invitation;
