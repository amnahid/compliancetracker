#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ComplianceTracker Health Check Report');
console.log('==========================================\n');

let issues = [];
let successes = [];

// Check if core files exist
const coreFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.ts',
  '.env',
  '.env.example',
  'middleware.ts',
  'app/layout.tsx',
  'app/page.tsx',
  'lib/auth.ts',
  'lib/mongodb.ts',
  'lib/models/User.ts',
  'lib/models/Task.ts',
  'lib/models/Document.ts'
];

console.log('📁 Core File Check:');
coreFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    successes.push(`Core file: ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    issues.push(`Missing core file: ${file}`);
  }
});

// Check dashboard pages
const dashboardPages = [
  'app/dashboard/page.tsx',
  'app/dashboard/tasks/page.tsx',
  'app/dashboard/documents/page.tsx',
  'app/dashboard/reports/page.tsx',
  'app/dashboard/staff/page.tsx',
  'app/dashboard/settings/page.tsx'
];

console.log('\n🏥 Dashboard Pages Check:');
dashboardPages.forEach(page => {
  const filePath = path.join(process.cwd(), page);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${page}`);
    successes.push(`Dashboard page: ${page}`);
  } else {
    console.log(`❌ ${page} - MISSING`);
    issues.push(`Missing dashboard page: ${page}`);
  }
});

// Check API routes
const apiRoutes = [
  'app/api/auth/[...nextauth]/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/tasks/route.ts',
  'app/api/tasks/[id]/route.ts',
  'app/api/documents/route.ts',
  'app/api/documents/[id]/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/stats/route.ts',
  'app/api/user/profile/route.ts',
  'app/api/user/notifications/route.ts',
  'app/api/user/security/route.ts',
  'app/api/organization/settings/route.ts'
];

console.log('\n🔌 API Routes Check:');
apiRoutes.forEach(route => {
  const filePath = path.join(process.cwd(), route);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${route}`);
    successes.push(`API route: ${route}`);
  } else {
    console.log(`❌ ${route} - MISSING`);
    issues.push(`Missing API route: ${route}`);
  }
});

// Check UI components
const uiComponents = [
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/input.tsx',
  'components/ui/label.tsx',
  'components/ui/select.tsx',
  'components/ui/dialog.tsx',
  'components/ui/table.tsx',
  'components/ui/badge.tsx',
  'components/ui/progress.tsx',
  'components/ui/tabs.tsx'
];

console.log('\n🎨 UI Components Check:');
let uiCount = 0;
uiComponents.forEach(component => {
  const filePath = path.join(process.cwd(), component);
  if (fs.existsSync(filePath)) {
    uiCount++;
  }
});
console.log(`✅ ${uiCount}/${uiComponents.length} UI components present`);
if (uiCount === uiComponents.length) {
  successes.push('All core UI components present');
} else {
  issues.push(`Missing ${uiComponents.length - uiCount} UI components`);
}

// Check package.json dependencies
console.log('\n📦 Dependencies Check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'next', 'react', 'react-dom', 'typescript', 'tailwindcss',
    'next-auth', 'mongoose', 'bcryptjs', 'lucide-react', 'sonner'
  ];
  
  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies present');
    successes.push('All required dependencies installed');
  } else {
    console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
  }
} catch (error) {
  console.log('❌ Error reading package.json');
  issues.push('Cannot read package.json');
}

// Check environment variables
console.log('\n🔧 Environment Variables Check:');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = [
    'MONGODB_URI', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'
  ];
  
  let missingEnvVars = [];
  requiredEnvVars.forEach(envVar => {
    if (!envContent.includes(envVar + '=')) {
      missingEnvVars.push(envVar);
    }
  });
  
  if (missingEnvVars.length === 0) {
    console.log('✅ All critical environment variables present');
    successes.push('All critical environment variables configured');
  } else {
    console.log(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
} catch (error) {
  console.log('❌ Error reading .env file');
  issues.push('Cannot read .env file');
}

// Summary
console.log('\n📊 Health Check Summary:');
console.log(`✅ Successful checks: ${successes.length}`);
console.log(`❌ Issues found: ${issues.length}`);

if (issues.length === 0) {
  console.log('\n🎉 Project Health: EXCELLENT');
  console.log('All critical components are in place and configured!');
} else {
  console.log('\n⚠️  Project Health: NEEDS ATTENTION');
  console.log('\nIssues to address:');
  issues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n==========================================');
console.log('Health check completed on:', new Date().toISOString());

// Exit with appropriate code
process.exit(issues.length === 0 ? 0 : 1);
