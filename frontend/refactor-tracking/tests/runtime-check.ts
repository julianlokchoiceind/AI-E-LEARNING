// runtime-check.ts
import { execSync } from 'child_process';
import * as path from 'path';

interface RuntimeTest {
  name: string;
  endpoint: string;
  expectedStatus: number;
}

async function checkRuntime() {
  console.log('🔍 Checking runtime functionality...\n');
  
  const tests: RuntimeTest[] = [
    { name: 'Homepage', endpoint: '/', expectedStatus: 200 },
    { name: 'Login Page', endpoint: '/login', expectedStatus: 200 },
    { name: 'Courses Page', endpoint: '/courses', expectedStatus: 200 },
    { name: 'API Health', endpoint: '/api/health', expectedStatus: 200 },
  ];
  
  const projectRoot = path.resolve(__dirname, '../../..');
  
  // Check if build exists
  try {
    execSync('ls .next/server', {
      cwd: path.join(projectRoot, 'frontend'),
      stdio: 'pipe'
    });
  } catch {
    console.error('❌ No build found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Start Next.js in production mode
  console.log('🚀 Starting Next.js server...');
  const server = execSync('npm run start', {
    cwd: path.join(projectRoot, 'frontend'),
    stdio: 'ignore'
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  let allPassed = true;
  
  // Test endpoints
  for (const test of tests) {
    try {
      const response = await fetch(`http://localhost:3000${test.endpoint}`);
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: ${response.status}`);
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Failed to connect`);
      allPassed = false;
    }
  }
  
  // Kill server
  try {
    execSync('pkill -f "next start"');
  } catch {}
  
  if (!allPassed) {
    console.error('\n❌ Some runtime checks failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All runtime checks passed!');
  }
}

checkRuntime().catch(console.error);
