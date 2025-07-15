// show-progress.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

function main() {
  const projectRoot = path.resolve(__dirname, '../../..');
  
  // Count current as any
  let currentAsAny = 0;
  try {
    const result = execSync(
      'grep -r "as any" . --include="*.ts" --include="*.tsx" | wc -l',
      { cwd: path.join(projectRoot, 'frontend'), encoding: 'utf-8' }
    );
    currentAsAny = parseInt(result.trim());
  } catch {}
  
  // Load baseline
  const baselinePath = path.join(projectRoot, 'frontend/refactor-tracking/baseline.json');
  let baseline: any = { totalAsAny: 55 };
  
  if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  }
  
  // Load checklist
  const checklistPath = path.join(projectRoot, 'frontend/refactor-tracking/as-any-checklist.md');
  const checklist = fs.readFileSync(checklistPath, 'utf-8');
  const completed = (checklist.match(/\[x\]/gi) || []).length;
  const total = (checklist.match(/\[.\]/gi) || []).length;
  
  // Calculate progress
  const asAnyProgress = ((baseline.totalAsAny - currentAsAny) / baseline.totalAsAny * 100).toFixed(1);
  const checklistProgress = (completed / total * 100).toFixed(1);
  
  console.log('📊 REFACTOR PROGRESS DASHBOARD');
  console.log('==============================\n');
  
  console.log('🎯 AS ANY Removal:');
  console.log(`   Original: ${baseline.totalAsAny}`);
  console.log(`   Current:  ${currentAsAny}`);
  console.log(`   Removed:  ${baseline.totalAsAny - currentAsAny}`);
  console.log(`   Progress: ${asAnyProgress}%`);
  
  console.log('\n✅ Checklist Progress:');
  console.log(`   Completed: ${completed}/${total}`);
  console.log(`   Progress:  ${checklistProgress}%`);
  
  // Show phase breakdown
  console.log('\n📋 Phase Breakdown:');
  const phases = checklist.match(/## PHASE \d+:.*$/gm) || [];
  phases.forEach(phase => {
    const phaseContent = checklist.substring(
      checklist.indexOf(phase),
      checklist.indexOf('## PHASE', checklist.indexOf(phase) + 1)
    );
    const phaseCompleted = (phaseContent.match(/\[x\]/gi) || []).length;
    const phaseTotal = (phaseContent.match(/\[.\]/gi) || []).length;
    const status = phaseCompleted === phaseTotal ? '✅' : 
                   phaseCompleted > 0 ? '🟨' : '⬜';
    
    console.log(`   ${status} ${phase} - ${phaseCompleted}/${phaseTotal}`);
  });
  
  // Next steps
  if (currentAsAny > 0) {
    console.log('\n🚀 Next Steps:');
    const unchecked = checklist.match(/- \[ \] .*/g) || [];
    console.log(`   ${unchecked.slice(0, 3).join('\n   ')}`);
    if (unchecked.length > 3) {
      console.log(`   ... and ${unchecked.length - 3} more`);
    }
  } else {
    console.log('\n🎉 CONGRATULATIONS! All "as any" removed!');
  }
  
  console.log('\n==============================');
}

main();
