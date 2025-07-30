#!/usr/bin/env node
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🐳 Comprehensive ShipStation MCP Server Test Suite');
console.log('   (Simulating Docker environment testing)\n');

const API_KEY = 'AN3nkGaXtwTRIE/TN15Av5zaDE/xn2xDZyZ4XgmLroQ';

// Ensure we have the API key in environment
process.env.SHIPSTATION_API_KEY = API_KEY;

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

const tests = [
  {
    name: 'Server Startup & Tool Discovery',
    test: async () => {
      const server = spawn('node', ['src/mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SHIPSTATION_API_KEY: API_KEY }
      });

      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        };

        const response = await sendRequest(server, request);
        
        if (!response.result?.tools || !Array.isArray(response.result.tools)) {
          throw new Error('Invalid tools response');
        }

        const tools = response.result.tools;
        const expectedTools = [
          'get_shipments', 'create_shipment', 'get_shipment_by_id', 'cancel_shipment',
          'get_labels', 'create_label', 'get_label_by_id', 'void_label', 'track_package',
          'calculate_rates', 'get_carriers', 'get_carrier_services',
          'get_warehouses', 'get_inventory'
        ];

        const toolNames = tools.map(t => t.name);
        const missingTools = expectedTools.filter(tool => !toolNames.includes(tool));
        
        if (missingTools.length > 0) {
          throw new Error(`Missing tools: ${missingTools.join(', ')}`);
        }

        return {
          success: true,
          message: `✅ Found all ${tools.length} expected tools`,
          details: { toolCount: tools.length, tools: toolNames }
        };
      } finally {
        server.kill();
      }
    }
  },

  {
    name: 'ShipStation API - Get Carriers',
    test: async () => {
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
            name: 'get_carriers',
            arguments: { page_size: 5 }
          }
        };

        const response = await sendRequest(server, request);
        
        if (response.result?.isError) {
          throw new Error(`API Error: ${response.result.content[0].text}`);
        }

        const content = JSON.parse(response.result.content[0].text);
        
        if (!content.carriers || !Array.isArray(content.carriers)) {
          throw new Error('Invalid carriers response format');
        }

        const carriers = content.carriers;
        return {
          success: true,
          message: `✅ Retrieved ${carriers.length} carriers from ShipStation API`,
          details: { 
            carrierCount: carriers.length,
            carriers: carriers.slice(0, 3).map(c => ({ id: c.carrier_id, name: c.friendly_name }))
          }
        };
      } finally {
        server.kill();
      }
    }
  },

  {
    name: 'ShipStation API - Calculate Rates',
    test: async () => {
      const server = spawn('node', ['src/mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SHIPSTATION_API_KEY: API_KEY }
      });

      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const request = {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'calculate_rates',
            arguments: {
              shipment: {
                ship_to: {
                  city_locality: 'Austin',
                  state_province: 'TX',
                  postal_code: '78701',
                  country_code: 'US'
                },
                ship_from: {
                  city_locality: 'Los Angeles',
                  state_province: 'CA',
                  postal_code: '90210',
                  country_code: 'US'
                },
                packages: [{
                  weight: { value: 2, unit: 'pound' },
                  dimensions: { unit: 'inch', length: 10, width: 8, height: 6 }
                }]
              }
            }
          }
        };

        const response = await sendRequest(server, request);
        
        if (response.result?.isError) {
          throw new Error(`API Error: ${response.result.content[0].text}`);
        }

        const content = JSON.parse(response.result.content[0].text);
        
        // Check for rate response structure
        if (!content.rate_response && !content.rates && !content.invalid_rates) {
          throw new Error('Invalid rate response format');
        }

        const rates = content.rate_response?.rates || content.rates || [];
        const invalidRates = content.rate_response?.invalid_rates || content.invalid_rates || [];

        return {
          success: true,
          message: `✅ Rate calculation successful: ${rates.length} valid rates, ${invalidRates.length} invalid rates`,
          details: { 
            validRates: rates.length,
            invalidRates: invalidRates.length,
            sampleRates: rates.slice(0, 2).map(r => ({
              carrier: r.carrier_friendly_name,
              service: r.service_type,
              rate: r.shipping_amount?.amount
            }))
          }
        };
      } finally {
        server.kill();
      }
    }
  },

  {
    name: 'ShipStation API - Get Warehouses', 
    test: async () => {
      const server = spawn('node', ['src/mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SHIPSTATION_API_KEY: API_KEY }
      });

      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const request = {
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'get_warehouses',
            arguments: { page_size: 10 }
          }
        };

        const response = await sendRequest(server, request);
        
        if (response.result?.isError) {
          throw new Error(`API Error: ${response.result.content[0].text}`);
        }

        const content = JSON.parse(response.result.content[0].text);
        
        if (!content.warehouses || !Array.isArray(content.warehouses)) {
          throw new Error('Invalid warehouses response format');
        }

        const warehouses = content.warehouses;
        return {
          success: true,
          message: `✅ Retrieved ${warehouses.length} warehouses from ShipStation API`,
          details: { 
            warehouseCount: warehouses.length,
            warehouses: warehouses.slice(0, 2).map(w => ({ 
              id: w.warehouse_id, 
              name: w.name,
              default: w.default_location 
            }))
          }
        };
      } finally {
        server.kill();
      }
    }
  },

  {
    name: 'Error Handling - Invalid Tool',
    test: async () => {
      const server = spawn('node', ['src/mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SHIPSTATION_API_KEY: API_KEY }
      });

      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const request = {
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'invalid_tool_name',
            arguments: {}
          }
        };

        const response = await sendRequest(server, request);
        
        if (!response.result?.isError) {
          throw new Error('Expected error response for invalid tool');
        }

        if (!response.result.content[0].text.includes('Unknown tool')) {
          throw new Error('Expected "Unknown tool" error message');
        }

        return {
          success: true,
          message: `✅ Properly handled invalid tool call`,
          details: { errorMessage: response.result.content[0].text }
        };
      } finally {
        server.kill();
      }
    }
  }
];

// Run all tests
const runTests = async () => {
  console.log(`Starting ${tests.length} comprehensive tests...\n`);
  
  const results = [];
  let passedTests = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`Test ${i + 1}/${tests.length}: ${test.name}`);
    
    try {
      const result = await test.test();
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 4));
      }
      results.push({ ...result, testName: test.name });
      passedTests++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      results.push({ 
        success: false, 
        testName: test.name, 
        error: error.message 
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log(`TEST SUMMARY: ${passedTests}/${tests.length} tests passed\n`);
  
  if (passedTests === tests.length) {
    console.log('🎉 ALL TESTS PASSED! ShipStation MCP Server is working correctly.');
    console.log('   - MCP protocol compliance: ✅');
    console.log('   - ShipStation API integration: ✅');
    console.log('   - Error handling: ✅');
    console.log('   - Real API connectivity: ✅');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
  }
  
  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    apiKey: API_KEY.substring(0, 10) + '...',
    summary: {
      total: tests.length,
      passed: passedTests,
      failed: tests.length - passedTests
    },
    results: results
  };
  
  writeFileSync('test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n📄 Detailed results saved to test-results.json');
};

runTests().catch(console.error);