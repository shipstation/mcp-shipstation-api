#!/usr/bin/env node
/**
 * Integration tests for ShipStation MCP Server with real API calls
 * These tests require SHIPSTATION_API_KEY environment variable
 */
import { spawn } from 'child_process';
import { test, describe } from 'node:test';
import assert from 'node:assert';

const API_KEY = process.env.SHIPSTATION_API_KEY;

// Skip integration tests if no API key provided
if (!API_KEY) {
  console.log('⚠️  Skipping integration tests - SHIPSTATION_API_KEY not provided');
  process.exit(0);
}

const sendRequest = (server, request) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 10000); // Longer timeout for API calls

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

describe('ShipStation API Integration Tests', () => {
  test('should retrieve carriers from ShipStation API', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, SHIPSTATION_API_KEY: API_KEY }
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'get_carriers',
          arguments: { page_size: 5 }
        }
      };

      const response = await sendRequest(server, request);
      
      assert.ok(response.result, 'Response should have result');
      assert.strictEqual(response.result.isError, undefined, 'Should not be an error');
      
      const content = JSON.parse(response.result.content[0].text);
      assert.ok(content.carriers, 'Content should have carriers');
      assert.ok(Array.isArray(content.carriers), 'Carriers should be an array');
      assert.ok(content.carriers.length > 0, 'Should have at least one carrier');
      
      // Verify carrier structure
      const carrier = content.carriers[0];
      assert.ok(carrier.carrier_id, 'Carrier should have ID');
      assert.ok(carrier.friendly_name, 'Carrier should have friendly name');
      assert.ok(Array.isArray(carrier.services), 'Carrier should have services array');

      console.log(`✅ Retrieved ${content.carriers.length} carriers successfully`);
    } finally {
      server.kill();
    }
  });

  test('should retrieve warehouses from ShipStation API', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, SHIPSTATION_API_KEY: API_KEY }
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_warehouses',
          arguments: { page_size: 10 }
        }
      };

      const response = await sendRequest(server, request);
      
      assert.ok(response.result, 'Response should have result');
      assert.strictEqual(response.result.isError, undefined, 'Should not be an error');
      
      const content = JSON.parse(response.result.content[0].text);
      assert.ok(content.warehouses, 'Content should have warehouses');
      assert.ok(Array.isArray(content.warehouses), 'Warehouses should be an array');
      
      if (content.warehouses.length > 0) {
        const warehouse = content.warehouses[0];
        assert.ok(warehouse.warehouse_id, 'Warehouse should have ID');
        assert.ok(warehouse.name, 'Warehouse should have name');
      }

      console.log(`✅ Retrieved ${content.warehouses.length} warehouses successfully`);
    } finally {
      server.kill();
    }
  });

  test('should handle API errors gracefully', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, SHIPSTATION_API_KEY: 'invalid_key' }
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_carriers',
          arguments: {}
        }
      };

      const response = await sendRequest(server, request);
      
      assert.ok(response.result, 'Response should have result');
      assert.strictEqual(response.result.isError, true, 'Should be an error response');
      assert.ok(response.result.content[0].text.includes('Error'), 'Should contain error message');

      console.log('✅ API error handling working correctly');
    } finally {
      server.kill();
    }
  });
});

console.log('🔗 Running ShipStation API Integration Tests...\n');