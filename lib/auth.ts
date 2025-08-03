import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, ensureModelsRegistered, getModel } from './model-registry';

// Debug environment variables
// Remove debug logging for security
if (process.env.NODE_ENV !== 'production') {
  console.log('NextAuth configuration loaded');
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await connectDB();
          // Ensure all models are registered
          ensureModelsRegistered();

          const User = getModel('User');
          const user = await User.findOne({ email: credentials.email }).select('+password').populate('organization');

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organization: user.organization,
            image: user.image,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // If user is signing in, update token with user data and always fetch fresh organization
      if (user) {
        token.role = user.role;
        
        // For new signins, add a small delay to ensure database writes are committed
        // This is especially important for invited users who just created accounts
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Always fetch fresh organization data from database to ensure populated object
        try {
          await connectDB();
          ensureModelsRegistered();
          
          const User = getModel('User');
          const dbUser = await User.findOne({ email: user.email }).populate('organization');
          if (dbUser && dbUser.organization && typeof dbUser.organization === 'object') {
            token.organization = dbUser.organization;
            console.log('JWT Callback - Fresh organization data for signin:', { 
              email: user.email,
              organization: dbUser.organization.name,
              organizationId: dbUser.organization._id
            });
          } else {
            token.organization = null; // No organization needs setup
            console.log('JWT Callback - No organization found for signin:', { 
              email: user.email,
              userOrganization: dbUser?.organization 
            });
          }
        } catch (error) {
          console.error('Error fetching organization data during signin:', error);
          token.organization = null;
        }
      }
      
      // If the session is being updated (e.g., after role change), refresh user data
      if (trigger === 'update' && token.email) {
        try {
          await connectDB();
          const UserModel = await import('./models/User').then(m => m.default);
          // Ensure all models are registered
          await ensureModelsRegistered();
          const dbUser = await UserModel.findOne({ email: token.email }).populate('organization');
          if (dbUser) {
            token.role = dbUser.role;
            // Handle both ObjectId and legacy string organizations
            if (dbUser.organization && typeof dbUser.organization === 'object') {
              token.organization = dbUser.organization;
            } else {
              token.organization = null; // Legacy user needs organization setup
            }
            console.log('JWT Callback - Updated token with fresh data:', { 
              email: token.email,
              role: dbUser.role, 
              organization: token.organization 
            });
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      
      // If organization is missing from token but user exists, fetch it
      if (!token.organization && token.email) {
        try {
          await connectDB();
          const UserModel = await import('./models/User').then(m => m.default);
          // Ensure all models are registered
          await ensureModelsRegistered();
          const dbUser = await UserModel.findOne({ email: token.email }).populate('organization');
          if (dbUser && dbUser.organization && typeof dbUser.organization === 'object') {
            token.organization = dbUser.organization;
            console.log('JWT Callback - Fetched missing organization:', { 
              email: token.email,
              organization: token.organization 
            });
          }
        } catch (error) {
          console.error('Error fetching organization in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.sub!;
          session.user.role = token.role;
          session.user.organization = token.organization;
          
          // If role or organization is missing from token, fetch from database using email
          if ((!token.role || !token.organization) && session.user?.email) {
            try {
              await connectDB();
              ensureModelsRegistered();
              
              const User = getModel('User');
              const dbUser = await User.findOne({ email: session.user.email }).populate('organization');
              if (dbUser) {
                session.user.role = dbUser.role;
                // Handle both ObjectId and legacy string organizations  
                if (dbUser.organization && typeof dbUser.organization === 'object') {
                  session.user.organization = dbUser.organization;
                } else {
                  session.user.organization = null; // Legacy user needs organization setup
                }
                console.log('Session Callback - Fetched missing data from DB by email:', { 
                  email: session.user.email,
                  role: dbUser.role,
                  organization: session.user.organization
                });
              }
            } catch (error) {
              console.error('Error fetching user data in session callback:', error);
            }
          }
          
          console.log('Session Callback - Final session data:', {
            userId: session.user.id,
            userEmail: session.user.email,
            userRole: session.user.role,
            userOrganization: session.user.organization
          });
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' || account?.provider === 'github') {
          await connectDB();
          
          // Import models to ensure they're registered
          const UserModel = await import('./models/User').then(m => m.default);
          const OrganizationModel = await import('./models/Organization').then(m => m.default);
          
          const existingUser = await UserModel.findOne({ email: user.email }).populate('organization');
          
          if (!existingUser) {
            // For OAuth users, we don't auto-create organizations anymore
            // They need to go through the proper organization setup flow
            
            // Create user without organization - they'll be redirected to setup
            const newUser = await UserModel.create({
              email: user.email,
              name: user.name,
              image: user.image,
              role: 'user',
              organization: null, // No organization yet
              provider: account.provider,
              emailVerified: new Date(),
            });
            
            // Don't set organization data in user object - will trigger setup flow
            user.role = newUser.role;
            user.organization = null;
          } else {
            // Update user object with existing data for this session
            user.role = existingUser.role;
            // Handle both ObjectId and legacy string organizations
            if (existingUser.organization && typeof existingUser.organization === 'object') {
              user.organization = existingUser.organization;
            } else {
              user.organization = null; // Legacy user needs organization setup
            }
          }
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure proper URL configuration
  ...(process.env.NEXTAUTH_URL && {
    url: process.env.NEXTAUTH_URL
  }),
};