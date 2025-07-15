// test-phase.ts
import RefactorTestSuite from './refactor-test-suite';
import * as path from 'path';

async function main() {
  const phase = process.argv[2];
  if (!phase) {
    console.error('Usage: ts-node test-phase.ts <phase-number>');
    process.exit(1);
  }
  
  const projectRoot = path.resolve(__dirname, '../../..');
  const suite = new RefactorTestSuite(projectRoot);
  
  let passed = false;
  
  switch (phase) {
    case '1':
      passed = await suite.testPhase1();
      break;
    case '2':
      passed = await suite.testPhase2();
      break;
    case '3':
      passed = await suite.testPhase3();
      break;
    default:
      console.error(`Unknown phase: ${phase}`);
      process.exit(1);
  }
  
  suite.generateReport();
  
  if (!passed) {
    console.error(`\n❌ Phase ${phase} tests failed!`);
    process.exit(1);
  } else {
    console.log(`\n✅ Phase ${phase} tests passed!`);
  }
}

main().catch(console.error);
