// capture-baseline.ts
import RefactorTestSuite from './refactor-test-suite';
import * as path from 'path';

async function main() {
  const projectRoot = path.resolve(__dirname, '../../..');
  const suite = new RefactorTestSuite(projectRoot);
  
  console.log('📸 Capturing baseline metrics...\n');
  await suite.captureBaseline();
  console.log('✅ Baseline captured successfully!');
}

main().catch(console.error);
