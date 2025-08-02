import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function AuthNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <FileX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Auth Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            The authentication page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Healthcare Compliance Tracker - Secure Authentication
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <Search className="mr-2 h-4 w-4" />
                Go to Sign In
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Need help? Contact support at{' '}
            <a href="mailto:support@healthcompliance.com" className="text-blue-600 hover:underline">
              support@healthcompliance.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
