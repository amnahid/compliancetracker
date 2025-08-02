import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Github } from 'lucide-react';

interface RegistrationInfo {
  provider: string;
  hasPassword: boolean;
  emailVerified: boolean;
  createdAt: string;
  registrationMethod: string;
  canChangePassword: boolean;
  authenticationMethods: string[];
}

export function UserRegistrationInfo() {
  const { data: session } = useSession();
  const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchRegistrationInfo();
    }
  }, [session]);

  const fetchRegistrationInfo = async () => {
    try {
      const response = await fetch('/api/user/registration-info');
      if (response.ok) {
        const data = await response.json();
        setRegistrationInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch registration info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Mail className="h-4 w-4" />;
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'credentials':
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-red-100 text-red-800';
      case 'github':
        return 'bg-gray-100 text-gray-800';
      case 'credentials':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading registration info...</div>;
  }

  if (!registrationInfo) {
    return <div className="text-red-500">Failed to load registration information</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getProviderIcon(registrationInfo.provider)}
          Account Registration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Registration Method:</span>
          <Badge className={getProviderColor(registrationInfo.provider)}>
            {registrationInfo.registrationMethod}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Provider:</span>
            <p className="font-medium capitalize">{registrationInfo.provider}</p>
          </div>
          
          <div>
            <span className="text-gray-600">Email Verified:</span>
            <p className="font-medium">
              {registrationInfo.emailVerified ? '✅ Verified' : '❌ Not Verified'}
            </p>
          </div>
          
          <div>
            <span className="text-gray-600">Has Password:</span>
            <p className="font-medium">
              {registrationInfo.hasPassword ? '✅ Yes' : '❌ OAuth Only'}
            </p>
          </div>
          
          <div>
            <span className="text-gray-600">Can Change Password:</span>
            <p className="font-medium">
              {registrationInfo.canChangePassword ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-600">Authentication Methods:</span>
          <div className="flex gap-2 mt-1">
            {registrationInfo.authenticationMethods.map((method, index) => (
              <Badge key={index} variant="outline">
                {method}
              </Badge>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t pt-3">
          Account created: {new Date(registrationInfo.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
