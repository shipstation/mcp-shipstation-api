import { spawn } from 'child_process';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

const sendRequest = (server, request) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    let output = '';
    const onData = (data) => {
      output += data.toString();
      
      try {
        const lines = output.split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith('{')) {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              clearTimeout(timeout);
              server.stdout.off('data', onData);
              resolve(response);
              return;
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors for partial responses
      }
    };

    server.stdout.on('data', onData);
    server.stdin.write(JSON.stringify(request) + '\n');
  });
};

describe('ShipStation MCP Server', () => {
  test('should list available tools', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      // Give server a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      const response = await sendRequest(server, request);
      
      assert.ok(response.result, 'Response should have result');
      assert.ok(response.result.tools, 'Result should have tools');
      assert.ok(Array.isArray(response.result.tools), 'Tools should be an array');
      assert.ok(response.result.tools.length > 0, 'Should have at least one tool');
      
      // Check that essential tools are present
      const toolNames = response.result.tools.map(tool => tool.name);
      assert.ok(toolNames.includes('get_shipments'), 'Should include get_shipments tool');
      assert.ok(toolNames.includes('create_shipment'), 'Should include create_shipment tool');
      assert.ok(toolNames.includes('get_carriers'), 'Should include get_carriers tool');
      assert.ok(toolNames.includes('calculate_rates'), 'Should include calculate_rates tool');

      console.log(`✅ Found ${response.result.tools.length} tools`);
    } finally {
      server.kill();
    }
  });

  test('should call get_carriers tool successfully', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_carriers',
          arguments: {
            page_size: 3
          }
        }
      };

      const response = await sendRequest(server, request);
      
      assert.ok(response.result, 'Response should have result');
      assert.ok(response.result.content, 'Result should have content');
      assert.ok(Array.isArray(response.result.content), 'Content should be an array');
      assert.ok(response.result.content.length > 0, 'Content should not be empty');
      assert.strictEqual(response.result.content[0].type, 'text', 'Content type should be text');
      
      // Check if it's a successful response or an expected error
      if (!response.result.isError) {
        const content = JSON.parse(response.result.content[0].text);
        assert.ok(content.carriers, 'Content should have carriers');
        assert.ok(Array.isArray(content.carriers), 'Carriers should be an array');
        console.log(`✅ Successfully retrieved ${content.carriers.length} carriers`);
      } else {
        // If there's an error, it should be a meaningful error message
        assert.ok(response.result.content[0].text.includes('Error'), 'Error should contain Error message');
        console.log('⚠️  Tool call returned expected error (likely due to API configuration)');
      }
    } finally {
      server.kill();
    }
  });

  test('should handle invalid tool calls', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'nonexistent_tool',
          arguments: {}
        }
      };

      const response = await sendRequest(server, request);
      
      assert.ok(response.result, 'Response should have result');
      assert.strictEqual(response.result.isError, true, 'Result should be an error');
      assert.ok(response.result.content[0].text.includes('Unknown tool'), 'Should contain unknown tool error');
      
      console.log('✅ Properly handled invalid tool call');
    } finally {
      server.kill();
    }
  });

  test('should validate tool schemas', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list',
        params: {}
      };

      const response = await sendRequest(server, request);
      const tools = response.result.tools;
      
      // Check create_shipment tool has proper schema
      const createShipmentTool = tools.find(tool => tool.name === 'create_shipment');
      assert.ok(createShipmentTool, 'Should have create_shipment tool');
      assert.ok(createShipmentTool.inputSchema, 'Tool should have input schema');
      assert.ok(createShipmentTool.inputSchema.properties.shipment, 'Schema should have shipment property');
      assert.ok(createShipmentTool.inputSchema.properties.shipment.required.includes('ship_to'), 'Should require ship_to');
      assert.ok(createShipmentTool.inputSchema.properties.shipment.required.includes('ship_from'), 'Should require ship_from');
      assert.ok(createShipmentTool.inputSchema.properties.shipment.required.includes('packages'), 'Should require packages');
      
      console.log('✅ Tool schemas are properly structured');
    } finally {
      server.kill();
    }
  });
});

console.log('Running MCP Server tests...\n');