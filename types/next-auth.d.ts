import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'admin';
      organization: string | object | null;
      image?: string;
    };
  }

  interface User {
    role: 'user' | 'admin';
    organization: string | object | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'user' | 'admin';
    organization: string | object | null;
  }
}