import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Shield, CheckCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-muted/60 py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30">
              <Shield className="mr-2 h-4 w-4" />
              For Small Healthcare Practices
            </Badge>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Stay Compliant,
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Stay Stress-Free
            </span>
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            The simplest way for dental practices, chiropractic clinics, and small healthcare providers 
            to track compliance tasks, manage documents, and never miss a deadline again.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="text-base bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/signup">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="text-base">
              <Link href="#pricing">
                View Pricing - $49/month
              </Link>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">HIPAA Training Tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Document Expiration Alerts</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">License Renewal Reminders</span>
            </div>
          </div>
          
          <div className="mt-12">
            <p className="text-sm text-muted-foreground">
              Trusted by healthcare practices nationwide
            </p>
            <div className="mt-6 flex items-center justify-center space-x-8 opacity-60">
              <div className="text-lg font-semibold text-muted-foreground">🦷 Dental Practices</div>
              <div className="text-lg font-semibold text-muted-foreground">🏥 Medical Clinics</div>
              <div className="text-lg font-semibold text-muted-foreground">🩺 Chiropractors</div>
              <div className="text-lg font-semibold text-muted-foreground">👁️ Optometry</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>
    </section>
  );
}