import mongoose, { Schema, model, models } from 'mongoose';

export interface ITask extends mongoose.Document {
  title: string;
  description?: string;
  dueDate: Date;
  assignee: mongoose.Types.ObjectId;
  organization: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  category: 'hipaa-training' | 'license-renewal' | 'safety-training' | 'documentation' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assignee is required'],
    index: true
  },
  organization: {
    type: String,
    required: [true, 'Organization is required'],
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    enum: ['hipaa-training', 'license-renewal', 'safety-training', 'documentation', 'other'],
    default: 'other',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
TaskSchema.index({ organization: 1, status: 1 });
TaskSchema.index({ organization: 1, assignee: 1 });
TaskSchema.index({ organization: 1, dueDate: 1 });
TaskSchema.index({ organization: 1, category: 1 });

// Virtual for checking if task is overdue
TaskSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && this.dueDate < new Date();
});

// Pre-save middleware to update status if overdue
TaskSchema.pre('save', function(next) {
  if (this.status !== 'completed' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

// Static method to find overdue tasks
TaskSchema.statics.findOverdue = function(organization: string) {
  return this.find({
    organization,
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  });
};

// Instance method to mark as completed
TaskSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  return this.save();
};

const Task = models.Task || model<ITask>('Task', TaskSchema);

export default Task;
