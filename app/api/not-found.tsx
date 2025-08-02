import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Home, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function ApiNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <FileX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">API Endpoint Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            The API endpoint you're trying to access doesn't exist or has been moved.
          </p>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700">
              This could be a missing API route or incorrect URL path.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <DollarSign className="mr-2 h-4 w-4" />
                Go to Dashboard
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
            If you believe this is an error, contact our technical team at{' '}
            <a href="mailto:tech@healthcompliance.com" className="text-blue-600 hover:underline">
              tech@healthcompliance.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
