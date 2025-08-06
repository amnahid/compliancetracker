// Script to create sample blog posts for testing
// Run with: node scripts/create-sample-blogs.js

const mongoose = require('mongoose');

// Blog schema (matching the main model)
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String },
  content: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['compliance', 'healthcare', 'hipaa', 'best-practices', 'updates', 'case-studies', 'tutorials', 'news'],
    default: 'compliance'
  },
  tags: [String],
  featuredImage: String,
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  views: { type: Number, default: 0 },
  readingTime: { type: Number },
  publishedAt: Date,
  metaTitle: String,
  metaDescription: String
}, {
  timestamps: true
});

// Pre-save middleware to calculate reading time and generate slug
blogSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

// Sample blog posts
const sampleBlogs = [
  {
    title: "HIPAA Compliance in 2024: What Healthcare Providers Need to Know",
    excerpt: "Stay up-to-date with the latest HIPAA requirements and best practices for protecting patient data in today's digital healthcare environment.",
    content: `
      <h2>Introduction</h2>
      <p>Healthcare data breaches continue to make headlines, making HIPAA compliance more critical than ever. In 2024, healthcare providers face evolving challenges in protecting patient information while delivering quality care.</p>
      
      <h2>Key HIPAA Requirements for 2024</h2>
      <p>The Health Insurance Portability and Accountability Act (HIPAA) requires healthcare organizations to:</p>
      <ul>
        <li>Implement administrative, physical, and technical safeguards</li>
        <li>Conduct regular risk assessments</li>
        <li>Train staff on privacy and security procedures</li>
        <li>Maintain compliance documentation</li>
      </ul>
      
      <h2>Common Compliance Challenges</h2>
      <p>Many healthcare organizations struggle with:</p>
      <ul>
        <li>Managing third-party vendor agreements</li>
        <li>Implementing proper access controls</li>
        <li>Ensuring mobile device security</li>
        <li>Maintaining audit logs</li>
      </ul>
      
      <h2>Best Practices for 2024</h2>
      <p>To maintain HIPAA compliance, consider these best practices:</p>
      <ol>
        <li><strong>Regular Training:</strong> Conduct quarterly HIPAA training sessions</li>
        <li><strong>Risk Assessments:</strong> Perform annual comprehensive risk assessments</li>
        <li><strong>Incident Response:</strong> Develop and test breach response procedures</li>
        <li><strong>Technology Updates:</strong> Keep all systems and software up-to-date</li>
      </ol>
      
      <h2>Conclusion</h2>
      <p>HIPAA compliance is an ongoing process that requires dedication and attention to detail. By implementing these best practices and staying informed about regulatory changes, healthcare providers can better protect patient data and avoid costly penalties.</p>
    `,
    category: 'hipaa',
    tags: ['HIPAA', 'compliance', 'healthcare', 'privacy', 'security'],
    status: 'published',
    metaTitle: "HIPAA Compliance Guide 2024 | Healthcare Data Protection",
    metaDescription: "Complete guide to HIPAA compliance for healthcare providers in 2024. Learn best practices for protecting patient data and avoiding penalties."
  },
  {
    title: "5 Essential Compliance Tracking Tools for Healthcare Organizations",
    excerpt: "Discover the must-have tools and technologies that can help your healthcare organization maintain compliance and streamline regulatory processes.",
    content: `
      <h2>Why Compliance Tracking Matters</h2>
      <p>Healthcare organizations face a complex web of regulations and requirements. Effective compliance tracking helps ensure your organization meets all obligations while reducing the risk of penalties and improving patient care quality.</p>
      
      <h2>1. Digital Document Management Systems</h2>
      <p>Modern document management systems provide:</p>
      <ul>
        <li>Centralized storage for compliance documents</li>
        <li>Version control and audit trails</li>
        <li>Automated retention policies</li>
        <li>Secure access controls</li>
      </ul>
      
      <h2>2. Risk Assessment Platforms</h2>
      <p>Comprehensive risk assessment tools help identify vulnerabilities and track remediation efforts. Key features include:</p>
      <ul>
        <li>Automated vulnerability scanning</li>
        <li>Risk scoring and prioritization</li>
        <li>Remediation tracking</li>
        <li>Compliance reporting</li>
      </ul>
      
      <h2>3. Training Management Software</h2>
      <p>Keeping staff trained on compliance requirements is crucial. Look for solutions that offer:</p>
      <ul>
        <li>Role-based training assignments</li>
        <li>Progress tracking and reporting</li>
        <li>Automated reminders</li>
        <li>Certification management</li>
      </ul>
      
      <h2>4. Incident Response Tools</h2>
      <p>When breaches or incidents occur, having the right tools can make all the difference:</p>
      <ul>
        <li>Incident logging and tracking</li>
        <li>Automated notification systems</li>
        <li>Investigation workflow management</li>
        <li>Regulatory reporting capabilities</li>
      </ul>
      
      <h2>5. Compliance Dashboard and Analytics</h2>
      <p>A comprehensive dashboard provides real-time visibility into your compliance posture:</p>
      <ul>
        <li>Key performance indicators (KPIs)</li>
        <li>Trend analysis and reporting</li>
        <li>Executive-level summaries</li>
        <li>Predictive analytics</li>
      </ul>
      
      <h2>Choosing the Right Tools</h2>
      <p>When selecting compliance tracking tools, consider:</p>
      <ul>
        <li>Integration capabilities with existing systems</li>
        <li>Scalability for future growth</li>
        <li>User-friendliness and adoption rates</li>
        <li>Vendor security and compliance credentials</li>
        <li>Total cost of ownership</li>
      </ul>
      
      <h2>Implementation Best Practices</h2>
      <p>To ensure successful implementation:</p>
      <ol>
        <li>Start with a clear assessment of current state</li>
        <li>Define success metrics and goals</li>
        <li>Plan for comprehensive staff training</li>
        <li>Implement in phases to manage change</li>
        <li>Establish ongoing maintenance procedures</li>
      </ol>
      
      <h2>Conclusion</h2>
      <p>The right compliance tracking tools can transform your organization's approach to regulatory management. By investing in these essential technologies, healthcare organizations can reduce compliance risks, improve efficiency, and focus more resources on patient care.</p>
    `,
    category: 'best-practices',
    tags: ['compliance tools', 'healthcare technology', 'risk management', 'digital transformation'],
    status: 'published',
    metaTitle: "5 Essential Compliance Tracking Tools for Healthcare | ComplianceTracker",
    metaDescription: "Discover must-have compliance tracking tools for healthcare organizations. Learn how technology can streamline regulatory processes and reduce risks."
  },
  {
    title: "Understanding Healthcare Data Breach Notification Requirements",
    excerpt: "A comprehensive guide to data breach notification requirements under HIPAA and state laws, including timelines, procedures, and best practices.",
    content: `
      <h2>The Critical Importance of Breach Notification</h2>
      <p>When a healthcare data breach occurs, proper notification is not just a legal requirement—it's essential for maintaining trust and minimizing damage. Understanding the complex web of notification requirements can help your organization respond effectively.</p>
      
      <h2>HIPAA Breach Notification Rule</h2>
      <p>Under HIPAA, covered entities must notify:</p>
      <ul>
        <li><strong>Individuals:</strong> Within 60 days of discovering the breach</li>
        <li><strong>HHS:</strong> Within 60 days (or immediately for breaches affecting 500+ individuals)</li>
        <li><strong>Media:</strong> Immediately for breaches affecting 500+ individuals in a state/jurisdiction</li>
      </ul>
      
      <h2>What Constitutes a Breach?</h2>
      <p>A breach is defined as the unauthorized acquisition, access, use, or disclosure of PHI that compromises its security or privacy. Key factors include:</p>
      <ul>
        <li>Unauthorized access to PHI</li>
        <li>Reasonable probability of compromise</li>
        <li>Failure of safeguards</li>
        <li>No exclusions apply</li>
      </ul>
      
      <h2>The Breach Assessment Process</h2>
      <p>When a potential breach is discovered, follow these steps:</p>
      <ol>
        <li><strong>Immediate Response:</strong> Contain the breach and assess scope</li>
        <li><strong>Investigation:</strong> Determine cause, extent, and affected individuals</li>
        <li><strong>Risk Assessment:</strong> Evaluate likelihood of PHI compromise</li>
        <li><strong>Documentation:</strong> Record all findings and decisions</li>
        <li><strong>Notification:</strong> Follow required notification procedures</li>
      </ol>
      
      <h2>Required Notification Content</h2>
      <p>Breach notifications must include:</p>
      <ul>
        <li>Description of what happened</li>
        <li>Types of PHI involved</li>
        <li>Steps individuals should take</li>
        <li>What the organization is doing</li>
        <li>Contact information for questions</li>
      </ul>
      
      <h2>State Law Requirements</h2>
      <p>Many states have additional notification requirements that may:</p>
      <ul>
        <li>Have shorter notification timeframes</li>
        <li>Apply to different types of information</li>
        <li>Require notification to state agencies</li>
        <li>Have specific content requirements</li>
      </ul>
      
      <h2>Business Associate Considerations</h2>
      <p>Business associates must:</p>
      <ul>
        <li>Notify covered entities immediately upon discovery</li>
        <li>Provide detailed information about the breach</li>
        <li>Assist with investigation and response</li>
        <li>Implement corrective measures</li>
      </ul>
      
      <h2>Best Practices for Breach Response</h2>
      <p>To ensure effective breach response:</p>
      <ul>
        <li>Develop and maintain an incident response plan</li>
        <li>Train staff on breach identification and reporting</li>
        <li>Establish clear escalation procedures</li>
        <li>Maintain relationships with legal counsel and forensic experts</li>
        <li>Practice breach response scenarios regularly</li>
      </ul>
      
      <h2>Common Notification Mistakes</h2>
      <p>Avoid these common pitfalls:</p>
      <ul>
        <li>Delayed discovery or notification</li>
        <li>Incomplete risk assessments</li>
        <li>Inadequate documentation</li>
        <li>Failure to consider state law requirements</li>
        <li>Poor communication with affected individuals</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Proper breach notification is a critical component of healthcare compliance. By understanding requirements, preparing in advance, and following best practices, organizations can respond effectively to breaches while minimizing legal and reputational risks.</p>
    `,
    category: 'compliance',
    tags: ['data breach', 'notification requirements', 'HIPAA', 'incident response'],
    status: 'published',
    metaTitle: "Healthcare Data Breach Notification Requirements Guide | HIPAA Compliance",
    metaDescription: "Complete guide to healthcare data breach notification requirements under HIPAA and state laws. Learn timelines, procedures, and best practices."
  }
];

async function createSampleBlogs() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/compliance-tracker';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Find the first user to assign as author (or create a default admin user)
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: { type: String, default: 'user' },
      organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
    }, { timestamps: true }));

    let author = await User.findOne({ role: 'admin' });
    if (!author) {
      author = await User.findOne();
    }
    
    if (!author) {
      console.log('No users found. Creating a default admin user...');
      author = new User({
        name: 'Blog Admin',
        email: 'admin@compliancetracker.com',
        password: 'hashed_password_placeholder',
        role: 'admin'
      });
      await author.save();
    }

    console.log(`Using author: ${author.name} (${author.email})`);

    // Create sample blogs
    for (const blogData of sampleBlogs) {
      try {
        // Check if blog already exists
        const existingBlog = await Blog.findOne({ slug: blogData.slug });
        if (existingBlog) {
          console.log(`Blog with slug "${blogData.slug}" already exists, skipping...`);
          continue;
        }

        const blog = new Blog({
          ...blogData,
          author: author._id,
          publishedAt: new Date()
        });

        await blog.save();
        console.log(`Created blog: "${blog.title}"`);
      } catch (error) {
        console.error(`Error creating blog "${blogData.title}":`, error.message);
      }
    }

    console.log('Sample blogs created successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error creating sample blogs:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSampleBlogs();
}

module.exports = { createSampleBlogs };
