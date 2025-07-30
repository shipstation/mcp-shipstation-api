#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('Testing MCP Server tool calls...\n');

const server = spawn('node', ['src/mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test the get_carriers tool
const toolCallRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'get_carriers',
    arguments: {
      page_size: 3
    }
  }
};

console.log('Testing get_carriers tool...');
server.stdin.write(JSON.stringify(toolCallRequest) + '\n');

let output = '';
let hasResponse = false;

server.stdout.on('data', (data) => {
  output += data.toString();
  
  try {
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.startsWith('{') && !hasResponse) {
        const response = JSON.parse(line);
        if (response.id === 1) {
          hasResponse = true;
          console.log('✅ Received response from MCP server');
          
          if (response.result?.isError) {
            console.log('⚠️  Tool call returned an error (expected if API key is invalid):');
            console.log(response.result.content[0].text);
          } else {
            console.log('✅ Tool call successful!');
            const content = response.result.content[0].text;
            const parsedContent = JSON.parse(content);
            console.log(`Found ${parsedContent.carriers?.length || 0} carriers`);
            
            if (parsedContent.carriers) {
              parsedContent.carriers.slice(0, 2).forEach(carrier => {
                console.log(`  - ${carrier.carrier_id}: ${carrier.friendly_name}`);
              });
            }
          }
          
          server.kill();
          console.log('\n🎉 Tool call test completed!');
          process.exit(0);
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors for partial responses
  }
});

server.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg && !msg.includes('ShipStation MCP server running')) {
    console.log('Server log:', msg);
  }
});

server.on('close', (code) => {
  if (!hasResponse) {
    console.log('❌ No response received from server');
  }
});

setTimeout(() => {
  server.kill();
  if (!hasResponse) {
    console.log('❌ Test timed out');
    process.exit(1);
  }
}, 5000);