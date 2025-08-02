'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="hds-nav-main sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="hds-container">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="hds-nav-brand flex items-center space-x-3 font-bold text-xl">
            <Shield className="h-7 w-7 text-primary" />
            <span className="hds-heading-xl">ComplianceTracker</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/#features" className="hds-nav-item hds-text-link">
              Features
            </Link>
            <Link href="/#pricing" className="hds-nav-item hds-text-link">
              Pricing
            </Link>
            <Link href="/#faq" className="hds-nav-item hds-text-link">
              FAQ
            </Link>
          </div>

          {/* Right side - Profile and Theme Toggle */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <ModeToggle />
              
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hds-btn-avatar relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                        <AvatarFallback className="hds-avatar-fallback">
                          {session.user.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="hds-dropdown w-56" align="end">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                      <div className="font-medium">{session.user.name}</div>
                      <div className="text-xs">{session.user.email}</div>
                      {session.user.organization && (
                        <div className="text-xs mt-1 text-primary font-medium">
                          {typeof session.user.organization === 'object' && session.user.organization
                            ? (session.user.organization as any).name
                            : session.user.organization}
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem asChild className="hds-dropdown-item">
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    {session.user.role === 'admin' && (
                      <DropdownMenuItem asChild className="hds-dropdown-item">
                        <Link href="/admin">Admin</Link>
                      </DropdownMenuItem>
                    )}
                    {session.user.role === 'admin' && (
                      <DropdownMenuItem asChild className="hds-dropdown-item">
                        <Link href="/organization/settings">Organization</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="hds-dropdown-item">
                      <Link href="/dashboard/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()} className="hds-dropdown-item hds-text-critical">
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" asChild className="hds-btn-ghost">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild className="hds-btn-primary">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-3">
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="hds-btn-mobile-menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="hds-nav-mobile md:hidden py-4 border-t">
            <div className="space-y-4">
              <Link 
                href="/#features" 
                className="block hds-nav-item hds-text-link py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/#pricing" 
                className="block hds-nav-item hds-text-link py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/#faq" 
                className="block hds-nav-item hds-text-link py-2"
                onClick={() => setIsOpen(false)}
              >
                FAQ
              </Link>
              
              {session ? (
                <div className="pt-4 border-t space-y-3">
                  <div className="pb-3 border-b">
                    <div className="text-sm font-medium">{session.user.name}</div>
                    <div className="text-xs text-muted-foreground">{session.user.email}</div>
                    {session.user.organization && (
                      <div className="text-xs text-primary font-medium mt-1">
                        {typeof session.user.organization === 'object' && session.user.organization
                          ? (session.user.organization as any).name
                          : session.user.organization}
                      </div>
                    )}
                  </div>
                  <Link href="/dashboard" className="block hds-nav-item hds-text-link py-2">
                    Dashboard
                  </Link>
                  {session.user.role === 'admin' && (
                    <Link href="/admin" className="block hds-nav-item hds-text-link py-2">
                      Admin
                    </Link>
                  )}
                  <Link href="/organization/settings" className="block hds-nav-item hds-text-link py-2">
                    Organization
                  </Link>
                  <Link href="/dashboard/settings" className="block hds-nav-item hds-text-link py-2">
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left hds-text-critical py-2"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t space-y-3">
                  <Link href="/auth/signin" className="block">
                    <Button variant="ghost" className="w-full hds-btn-ghost">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full hds-btn-primary">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
