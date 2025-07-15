// /frontend/refactor-tracking/tests/refactor-test-suite.ts

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  phase: string;
  test: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

interface RefactorMetrics {
  totalAsAny: number;
  typeErrors: number;
  buildTime: number;
  bundleSize: number;
  testsPassed: number;
  testsTotal: number;
}

class RefactorTestSuite {
  private results: TestResult[] = [];
  private baselineMetrics: RefactorMetrics | null = null;
  
  constructor(private projectRoot: string) {}

  // Capture baseline metrics before refactoring
  async captureBaseline(): Promise<void> {
    console.log('📊 Capturing baseline metrics...');
    
    this.baselineMetrics = {
      totalAsAny: this.countAsAny(),
      typeErrors: this.countTypeErrors(),
      buildTime: await this.measureBuildTime(),
      bundleSize: await this.getBundleSize(),
      testsPassed: await this.runTests(),
      testsTotal: await this.countTests()
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'refactor-tracking/baseline.json'),
      JSON.stringify(this.baselineMetrics, null, 2)
    );
  }

  // Phase 1: Type Infrastructure Tests
  async testPhase1(): Promise<boolean> {
    console.log('\n🧪 Testing Phase 1: Type Infrastructure');
    
    const tests = [
      () => this.checkFileExists('types/browser.d.ts'),
      () => this.checkFileExists('lib/types/forms.ts'),
      () => this.checkFileExists('lib/types/auth.ts'),
      () => this.checkNoNewTypeErrors(),
      () => this.checkBuildSucceeds(),
    ];
    
    return this.runPhaseTests('Phase 1', tests);
  }

  // Phase 2: Browser API Tests
  async testPhase2(): Promise<boolean> {
    console.log('\n🧪 Testing Phase 2: Browser APIs');
    
    const tests = [
      () => this.checkNavigatorAPIs(),
      () => this.checkBatteryAPI(),
      () => this.checkPerformanceAPI(),
      () => this.checkYouTubePlayer(),
      () => this.checkNoRuntimeErrors(),
    ];
    
    return this.runPhaseTests('Phase 2', tests);
  }

  // Phase 3: Response Type Tests
  async testPhase3(): Promise<boolean> {
    console.log('\n🧪 Testing Phase 3: Response Types');
    
    const tests = [
      () => this.checkAuthFlow(),
      () => this.checkCourseDataFlow(),
      () => this.checkAPIClientHeaders(),
      () => this.checkDataAccess(),
    ];
    
    return this.runPhaseTests('Phase 3', tests);
  }

  // Test Implementations
  private checkFileExists(filePath: string): TestResult {
    const fullPath = path.join(this.projectRoot, 'frontend', filePath);
    const exists = fs.existsSync(fullPath);
    
    return {
      phase: 'Infrastructure',
      test: `File exists: ${filePath}`,
      passed: exists,
      error: exists ? undefined : `File not found: ${fullPath}`
    };
  }

  private checkNoNewTypeErrors(): TestResult {
    const currentErrors = this.countTypeErrors();
    const baseline = this.baselineMetrics?.typeErrors || 0;
    
    return {
      phase: 'Type Safety',
      test: 'No new TypeScript errors',
      passed: currentErrors <= baseline,
      error: currentErrors > baseline 
        ? `New errors introduced: ${currentErrors - baseline}`
        : undefined
    };
  }

  private checkBuildSucceeds(): TestResult {
    try {
      execSync('npm run build', { 
        cwd: path.join(this.projectRoot, 'frontend'),
        stdio: 'pipe' 
      });
      return {
        phase: 'Build',
        test: 'Production build succeeds',
        passed: true
      };
    } catch (error) {
      return {
        phase: 'Build',
        test: 'Production build succeeds',
        passed: false,
        error: 'Build failed'
      };
    }
  }

  private checkNavigatorAPIs(): TestResult {
    const testCode = `
      import type { NavigatorExtended } from '@/types/browser';
      const nav = navigator as NavigatorExtended;
      const conn = nav.connection || nav.mozConnection;
      console.log(conn ? 'Navigator API works' : 'No connection API');
    `;
    
    return this.testTypeScriptCode('Navigator APIs', testCode);
  }

  private checkBatteryAPI(): TestResult {
    const testCode = `
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          console.log('Battery level:', battery.level);
        });
      }
    `;
    
    return this.testTypeScriptCode('Battery API', testCode);
  }

  private checkPerformanceAPI(): TestResult {
    const testCode = `
      import type { PerformanceExtended } from '@/types/browser';
      const perf = performance as PerformanceExtended;
      if (perf.memory) {
        console.log('Memory:', perf.memory.usedJSHeapSize);
      }
    `;
    
    return this.testTypeScriptCode('Performance API', testCode);
  }

  private checkYouTubePlayer(): TestResult {
    const hasYTTypes = this.checkTypeDefinition('YT', 'YTPlayer');
    return {
      phase: 'YouTube',
      test: 'YouTube Player types defined',
      passed: hasYTTypes,
      error: hasYTTypes ? undefined : 'YouTube types not found'
    };
  }

  private checkAuthFlow(): TestResult {
    // Test auth response handling
    const files = [
      'lib/auth.ts',
      'lib/types/auth.ts'
    ];
    
    const allExist = files.every(f => 
      fs.existsSync(path.join(this.projectRoot, 'frontend', f))
    );
    
    return {
      phase: 'Auth',
      test: 'Auth type safety',
      passed: allExist && this.noAsAnyInFiles(files),
      error: allExist ? undefined : 'Auth files missing or contain as any'
    };
  }

  private checkCourseDataFlow(): TestResult {
    const pattern = /data as any|as any\)\.data/;
    const hasAsAny = this.searchInFiles(pattern, ['**/*.tsx', '**/*.ts']);
    
    return {
      phase: 'Data Flow',
      test: 'Course data type safety',
      passed: !hasAsAny,
      error: hasAsAny ? 'Found data cast patterns' : undefined
    };
  }

  private checkAPIClientHeaders(): TestResult {
    const file = 'lib/api/api-client.ts';
    const content = fs.readFileSync(
      path.join(this.projectRoot, 'frontend', file), 
      'utf-8'
    );
    
    const hasAsAny = content.includes('as any');
    
    return {
      phase: 'API Client',
      test: 'API client type safety',
      passed: !hasAsAny,
      error: hasAsAny ? 'API client still contains as any' : undefined
    };
  }

  private checkDataAccess(): TestResult {
    // Check for unsafe data access patterns
    const unsafePatterns = [
      /response\.data\./,
      /data\.\w+\s*&&/,
      /\?\.\w+\s+as\s+any/
    ];
    
    const hasUnsafe = unsafePatterns.some(pattern => 
      this.searchInFiles(pattern, ['**/*.tsx', '**/*.ts'])
    );
    
    return {
      phase: 'Data Access',
      test: 'Safe data access patterns',
      passed: !hasUnsafe,
      error: hasUnsafe ? 'Unsafe data access found' : undefined
    };
  }

  private checkNoRuntimeErrors(): TestResult {
    // This would ideally run the app and check console
    // For now, we'll check critical runtime paths compile
    
    const criticalPaths = [
      'app/(auth)/login/page.tsx',
      'app/(dashboard)/dashboard/page.tsx',
      'app/(public)/courses/page.tsx'
    ];
    
    const allCompile = criticalPaths.every(filepath => {
      try {
        execSync(`npx tsc --noEmit ${filepath}`, {
          cwd: path.join(this.projectRoot, 'frontend'),
          stdio: 'pipe'
        });
        return true;
      } catch {
        return false;
      }
    });
    
    return {
      phase: 'Runtime',
      test: 'Critical paths compile',
      passed: allCompile,
      error: allCompile ? undefined : 'Critical paths have errors'
    };
  }

  // Utility Methods
  private countAsAny(): number {
    try {
      const result = execSync(
        'grep -r "as any" . --include="*.ts" --include="*.tsx" | wc -l',
        { cwd: path.join(this.projectRoot, 'frontend'), encoding: 'utf-8' }
      );
      return parseInt(result.trim());
    } catch {
      return 0;
    }
  }

  private countTypeErrors(): number {
    try {
      execSync('npx tsc --noEmit', {
        cwd: path.join(this.projectRoot, 'frontend'),
        stdio: 'pipe'
      });
      return 0;
    } catch (error: any) {
      const output = error.stdout?.toString() || '';
      const matches = output.match(/Found (\d+) error/);
      return matches ? parseInt(matches[1]) : 999;
    }
  }

  private async measureBuildTime(): Promise<number> {
    const start = Date.now();
    try {
      execSync('npm run build', {
        cwd: path.join(this.projectRoot, 'frontend'),
        stdio: 'pipe'
      });
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async getBundleSize(): Promise<number> {
    const buildDir = path.join(this.projectRoot, 'frontend', '.next');
    try {
      const result = execSync(`du -sk ${buildDir}`, { encoding: 'utf-8' });
      return parseInt(result.split('\t')[0]);
    } catch {
      return 0;
    }
  }

  private async runTests(): Promise<number> {
    try {
      const result = execSync('npm test -- --passWithNoTests', {
        cwd: path.join(this.projectRoot, 'frontend'),
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      const matches = result.match(/Tests:\s+(\d+)\s+passed/);
      return matches ? parseInt(matches[1]) : 0;
    } catch {
      return 0;
    }
  }

  private async countTests(): Promise<number> {
    try {
      const result = execSync(
        'find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | wc -l',
        { cwd: path.join(this.projectRoot, 'frontend'), encoding: 'utf-8' }
      );
      return parseInt(result.trim());
    } catch {
      return 0;
    }
  }

  private testTypeScriptCode(testName: string, code: string): TestResult {
    const tempFile = path.join(this.projectRoot, 'frontend', 'temp-test.ts');
    fs.writeFileSync(tempFile, code);
    
    try {
      execSync(`npx tsc --noEmit ${tempFile}`, {
        cwd: path.join(this.projectRoot, 'frontend'),
        stdio: 'pipe'
      });
      fs.unlinkSync(tempFile);
      return {
        phase: 'TypeScript',
        test: testName,
        passed: true
      };
    } catch (error) {
      fs.unlinkSync(tempFile);
      return {
        phase: 'TypeScript',
        test: testName,
        passed: false,
        error: 'TypeScript compilation failed'
      };
    }
  }

  private checkTypeDefinition(typeName: string, memberName?: string): boolean {
    const browserTypes = path.join(this.projectRoot, 'frontend/types/browser.d.ts');
    if (!fs.existsSync(browserTypes)) return false;
    
    const content = fs.readFileSync(browserTypes, 'utf-8');
    const hasType = content.includes(`interface ${typeName}`) || 
                   content.includes(`type ${typeName}`);
    
    if (!memberName) return hasType;
    
    return hasType && content.includes(memberName);
  }

  private noAsAnyInFiles(files: string[]): boolean {
    return files.every(file => {
      const fullPath = path.join(this.projectRoot, 'frontend', file);
      if (!fs.existsSync(fullPath)) return false;
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      return !content.includes('as any');
    });
  }

  private searchInFiles(pattern: RegExp, globs: string[]): boolean {
    // Simplified - in real implementation use glob library
    try {
      const result = execSync(
        `grep -r "${pattern.source}" . --include="*.ts" --include="*.tsx"`,
        { cwd: path.join(this.projectRoot, 'frontend'), encoding: 'utf-8' }
      );
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  private async runPhaseTests(phase: string, tests: Array<() => TestResult | Promise<TestResult>>): Promise<boolean> {
    let allPassed = true;
    
    for (const test of tests) {
      const result = await test();
      this.results.push(result);
      
      if (result.passed) {
        console.log(`✅ ${result.test}`);
      } else {
        console.log(`❌ ${result.test}: ${result.error}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  // Generate final report
  generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      baseline: this.baselineMetrics,
      current: {
        totalAsAny: this.countAsAny(),
        typeErrors: this.countTypeErrors(),
      },
      testResults: this.results,
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'refactor-tracking/test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`\nAS ANY Count: ${report.baseline?.totalAsAny} → ${report.current.totalAsAny}`);
  }
}

// Export for use in npm scripts
export default RefactorTestSuite;
