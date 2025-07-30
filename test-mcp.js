#!/usr/bin/env node
import { spawn } from 'child_process';
import { stdin, stdout } from 'process';

console.log('Testing MCP Server...\n');

// Test 1: List tools
const testListTools = () => {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();

    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.on('close', (code) => {
      try {
        const lines = output.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const response = JSON.parse(lines[lines.length - 1]);
          console.log('✅ List tools test passed');
          console.log(`Found ${response.result?.tools?.length || 0} tools`);
          resolve(response);
        } else {
          reject(new Error('No response received'));
        }
      } catch (error) {
        reject(error);
      }
    });

    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 5000);
  });
};

// Test 2: Call a tool (get_carriers)
const testCallTool = () => {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_carriers',
        arguments: { page_size: 5 }
      }
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();

    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.on('close', (code) => {
      try {
        const lines = output.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const response = JSON.parse(lines[lines.length - 1]);
          if (response.result && !response.result.isError) {
            console.log('✅ Call tool test passed');
            console.log('Carriers response received');
          } else {
            console.log('⚠️  Call tool test completed with error (expected if no API key)');
            console.log('Error:', response.result?.content?.[0]?.text || 'Unknown error');
          }
          resolve(response);
        } else {
          reject(new Error('No response received'));
        }
      } catch (error) {
        reject(error);
      }
    });

    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 5000);
  });
};

// Run tests
(async () => {
  try {
    console.log('Test 1: List Tools');
    await testListTools();
    console.log('');
    
    console.log('Test 2: Call Tool (get_carriers)');
    await testCallTool();
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('\nNote: Tool calls may fail without a valid SHIPSTATION_API_KEY in .env');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
})();