// run-all-tests.ts
import RefactorTestSuite from './refactor-test-suite';
import * as path from 'path';

async function main() {
  const projectRoot = path.resolve(__dirname, '../../..');
  const suite = new RefactorTestSuite(projectRoot);
  
  console.log('🚀 Running all refactor tests...\n');
  
  const phases = [
    suite.testPhase1(),
    suite.testPhase2(),
    suite.testPhase3(),
  ];
  
  const results = await Promise.all(phases);
  suite.generateReport();
  
  const allPassed = results.every(r => r);
  
  if (!allPassed) {
    console.error('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

main().catch(console.error);
