#!/usr/bin/env node
/**
 * Test runner for ShipStation MCP Server
 * Runs different test suites based on environment and arguments
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const runTests = async (testPath, description) => {
  console.log(`\n🧪 ${description}`);
  console.log('='.repeat(50));
  
  return new Promise((resolve) => {
    const testProcess = spawn('node', ['--test', testPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - PASSED`);
      } else {
        console.log(`❌ ${description} - FAILED (exit code: ${code})`);
      }
      resolve(code);
    });
  });
};

const main = async () => {
  console.log('🚀 ShipStation MCP Server Test Suite');
  
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  let exitCode = 0;
  
  // Check if API key is available for integration tests
  const hasApiKey = !!process.env.SHIPSTATION_API_KEY;
  
  switch (testType) {
    case 'unit':
      exitCode = await runTests('tests/unit/**/*.test.js', 'Unit Tests');
      break;
      
    case 'integration':
      if (!hasApiKey) {
        console.log('\n⚠️  Skipping integration tests - SHIPSTATION_API_KEY not set');
        break;
      }
      exitCode = await runTests('tests/integration/**/*.test.js', 'Integration Tests');
      break;
      
    case 'e2e':
      if (!hasApiKey) {
        console.log('\n⚠️  Skipping e2e tests - SHIPSTATION_API_KEY not set');
        break;
      }
      exitCode = await runTests('tests/e2e/**/*.test.js', 'End-to-End Tests');
      break;
      
    case 'all':
    default:
      // Run unit tests first
      let code = await runTests('tests/unit/**/*.test.js', 'Unit Tests');
      if (code !== 0) exitCode = code;
      
      // Run integration tests if API key available
      if (hasApiKey) {
        code = await runTests('tests/integration/**/*.test.js', 'Integration Tests');
        if (code !== 0) exitCode = code;
        
        // Skip e2e tests by default in 'all' mode (they require Docker)
        console.log('\n📝 Note: Run "npm run test:e2e" to test Docker deployment');
      } else {
        console.log('\n⚠️  Skipping integration/e2e tests - Set SHIPSTATION_API_KEY to run API tests');
      }
      break;
  }
  
  console.log('\n' + '='.repeat(50));
  if (exitCode === 0) {
    console.log('🎉 All tests completed successfully!');
  } else {
    console.log('💥 Some tests failed. Check output above.');
  }
  
  process.exit(exitCode);
};

main().catch(console.error);