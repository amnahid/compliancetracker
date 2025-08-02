import mongoose, { Schema, model, models } from 'mongoose';

export interface IDocument extends mongoose.Document {
  name: string;
  type: string;
  category: 'policy' | 'procedure' | 'training' | 'license' | 'certificate' | 'other';
  uploadedBy: mongoose.Types.ObjectId;
  organization: string;
  uploadDate: Date;
  expirationDate?: Date;
  size: number;
  url: string;
  fileData?: string; // Base64 encoded file data (for demo purposes)
  tags?: string[];
  version?: number;
  isActive: boolean;
  // Access control fields
  visibility: 'public' | 'restricted';
  assignedTo?: mongoose.Types.ObjectId[]; // Users who can access if restricted
  departments?: string[]; // Department-based access control
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [255, 'Document name cannot exceed 255 characters']
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['policy', 'procedure', 'training', 'license', 'certificate', 'other'],
    default: 'other',
    index: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
    index: true
  },
  organization: {
    type: String,
    required: [true, 'Organization is required'],
    index: true
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  expirationDate: {
    type: Date,
    index: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  url: {
    type: String,
    required: [true, 'Document URL is required']
  },
  fileData: {
    type: String,
    select: false // Exclude from default queries for performance
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Access control fields
  visibility: {
    type: String,
    enum: ['public', 'restricted'],
    default: 'public',
    index: true
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  departments: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
DocumentSchema.index({ organization: 1, category: 1 });
DocumentSchema.index({ organization: 1, expirationDate: 1 });
DocumentSchema.index({ organization: 1, uploadDate: -1 });
DocumentSchema.index({ organization: 1, isActive: 1 });
DocumentSchema.index({ organization: 1, visibility: 1 });
DocumentSchema.index({ organization: 1, assignedTo: 1 });

// Virtual for checking expiration status
DocumentSchema.virtual('expirationStatus').get(function() {
  if (!this.expirationDate) return 'no-expiration';
  
  const now = new Date();
  const daysUntilExpiration = Math.ceil((this.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 30) return 'expiring-soon';
  return 'active';
});

// Virtual for human-readable file size
DocumentSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to find expired documents
DocumentSchema.statics.findExpired = function(organization: string) {
  return this.find({
    organization,
    isActive: true,
    expirationDate: { $lt: new Date() }
  });
};

// Static method to find expiring documents
DocumentSchema.statics.findExpiring = function(organization: string, days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    organization,
    isActive: true,
    expirationDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  });
};

// Instance method to archive document
DocumentSchema.methods.archive = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to create new version
DocumentSchema.methods.createNewVersion = function() {
  this.version = (this.version || 1) + 1;
  return this.save();
};

// Pre-save middleware to validate expiration date
DocumentSchema.pre('save', function(next) {
  if (this.expirationDate && this.expirationDate <= this.uploadDate) {
    next(new Error('Expiration date must be after upload date'));
  } else {
    next();
  }
});

const Document = models.Document || model<IDocument>('Document', DocumentSchema);

export default Document;
