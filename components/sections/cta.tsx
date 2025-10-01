import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-blue-600">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop Worrying About Compliance
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join healthcare practices already using our system to stay compliant, organized, and stress-free. 
            Your 14-day free trial starts immediately.
          </p>
          
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="text-base bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/auth/signup">
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="text-base border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="#pricing">
                View Pricing (Starting at $49/mo)
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center items-center text-blue-100 text-sm">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              HIPAA Compliant
            </div>
            <div className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2" />
              No Credit Card Required
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Setup in 5 Minutes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}