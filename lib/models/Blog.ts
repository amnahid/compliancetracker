import mongoose from 'mongoose';

export interface IBlog extends mongoose.Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date;
  readingTime: number; // in minutes
  views: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateReadingTime(): number;
  incrementViews(): Promise<number>;
}

// Interface for static methods
interface IBlogModel extends mongoose.Model<IBlog> {
  getPublished(limit?: number, skip?: number): mongoose.Query<IBlog[], IBlog>;
  getByCategory(category: string, limit?: number): mongoose.Query<IBlog[], IBlog>;
}

const BlogSchema = new mongoose.Schema<IBlog, IBlogModel>({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Blog slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  excerpt: {
    type: String,
    required: [true, 'Blog excerpt is required'],
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Blog content is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Blog author is required']
  },
  category: {
    type: String,
    required: [true, 'Blog category is required'],
    enum: [
      'compliance',
      'healthcare',
      'hipaa',
      'best-practices',
      'updates',
      'case-studies',
      'tutorials',
      'news'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featuredImage: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  publishedAt: {
    type: Date
  },
  readingTime: {
    type: Number,
    default: 1,
    min: [1, 'Reading time must be at least 1 minute']
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
// Note: slug index is automatically created by unique: true
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ category: 1, status: 1 });
BlogSchema.index({ tags: 1, status: 1 });
BlogSchema.index({ author: 1 });

// Virtual for URL
BlogSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Method to calculate reading time based on content
BlogSchema.methods.calculateReadingTime = function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  return this.readingTime;
};

// Method to increment views
BlogSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this.views;
};

// Static method to get published blogs
BlogSchema.statics.getPublished = function(limit = 10, skip = 0) {
  return this.find({ status: 'published' })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get blogs by category
BlogSchema.statics.getByCategory = function(category: string, limit = 10) {
  return this.find({ status: 'published', category })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Static method to search blogs
BlogSchema.statics.search = function(query: string, limit = 10) {
  return this.find({
    status: 'published',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { excerpt: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Pre-save middleware
BlogSchema.pre('save', function(next) {
  // Auto-generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Calculate reading time
  if (this.isModified('content')) {
    this.calculateReadingTime();
  }
  
  // Set published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Auto-generate meta fields if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.metaDescription && this.excerpt) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Register the model
const Blog = mongoose.models.Blog || mongoose.model<IBlog, IBlogModel>('Blog', BlogSchema);

export default Blog;
