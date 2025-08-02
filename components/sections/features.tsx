import { 
  Shield, 
  CheckCircle, 
  FileText, 
  Bell, 
  Users, 
  Clock,
  Award,
  Heart,
  Building
} from 'lucide-react';

const features = [
  {
    icon: CheckCircle,
    title: 'Task Management',
    description: 'Track HIPAA training, license renewals, and compliance deadlines with automated reminders.',
  },
  {
    icon: FileText,
    title: 'Document Storage',
    description: 'Securely store policies, certificates, and training records with expiration tracking.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Never miss a deadline with automated email alerts for tasks and document renewals.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Manage up to 5 staff members with role-based access and individual task assignments.',
  },
  {
    icon: Shield,
    title: 'HIPAA Compliance',
    description: 'Built specifically for healthcare with HIPAA-compliant data handling and security.',
  },
  {
    icon: Clock,
    title: 'Deadline Tracking',
    description: 'Visual compliance score and priority-based task organization to stay on track.',
  },
  {
    icon: Award,
    title: 'Certification Management',
    description: 'Track staff certifications, training completions, and renewal requirements.',
  },
  {
    icon: Heart,
    title: 'Patient Safety Focus',
    description: 'Ensure continuous compliance to maintain the highest standards of patient care.',
  },
  {
    icon: Building,
    title: 'Practice-Specific',
    description: 'Designed for dental offices, chiropractic clinics, and small healthcare practices.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need for Healthcare Compliance
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Designed specifically for small healthcare practices with non-tech-savvy staff
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 shadow-sm transition-all hover:shadow-lg hover:border-blue-200"
              >
                <div className="mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}