#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('Testing MCP Server startup...\n');

const server = spawn('node', ['src/mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

console.log('Sending list tools request...');
server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  
  try {
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.startsWith('{')) {
        const response = JSON.parse(line);
        if (response.id === 1) {
          console.log('✅ Received response from MCP server');
          console.log(`Found ${response.result?.tools?.length || 0} tools:`);
          
          if (response.result?.tools) {
            response.result.tools.forEach(tool => {
              console.log(`  - ${tool.name}: ${tool.description}`);
            });
          }
          
          server.kill();
          console.log('\n🎉 MCP server test completed successfully!');
          process.exit(0);
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors for partial responses
  }
});

server.stderr.on('data', (data) => {
  console.log('Server log:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

setTimeout(() => {
  server.kill();
  console.log('❌ Test timed out');
  process.exit(1);
}, 3000);