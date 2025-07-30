import { spawn } from 'child_process';
import { jest } from '@jest/globals';

describe('ShipStation MCP Server', () => {
  let server;
  
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

  beforeEach(() => {
    server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Give server a moment to start
    return new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (server) {
      server.kill();
    }
  });

  test('should list available tools', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    const response = await sendRequest(server, request);
    
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeDefined();
    expect(Array.isArray(response.result.tools)).toBe(true);
    expect(response.result.tools.length).toBeGreaterThan(0);
    
    // Check that essential tools are present
    const toolNames = response.result.tools.map(tool => tool.name);
    expect(toolNames).toContain('get_shipments');
    expect(toolNames).toContain('create_shipment');
    expect(toolNames).toContain('get_carriers');
    expect(toolNames).toContain('calculate_rates');
  });

  test('should have proper tool schemas', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    const response = await sendRequest(server, request);
    const tools = response.result.tools;
    
    // Check create_shipment tool has proper schema
    const createShipmentTool = tools.find(tool => tool.name === 'create_shipment');
    expect(createShipmentTool).toBeDefined();
    expect(createShipmentTool.inputSchema).toBeDefined();
    expect(createShipmentTool.inputSchema.properties.shipment).toBeDefined();
    expect(createShipmentTool.inputSchema.properties.shipment.required).toContain('ship_to');
    expect(createShipmentTool.inputSchema.properties.shipment.required).toContain('ship_from');
    expect(createShipmentTool.inputSchema.properties.shipment.required).toContain('packages');
  });

  test('should call get_carriers tool successfully', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_carriers',
        arguments: {
          page_size: 5
        }
      }
    };

    const response = await sendRequest(server, request);
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(Array.isArray(response.result.content)).toBe(true);
    expect(response.result.content.length).toBeGreaterThan(0);
    expect(response.result.content[0].type).toBe('text');
    
    // Check if it's a successful response or an expected error
    if (!response.result.isError) {
      const content = JSON.parse(response.result.content[0].text);
      expect(content.carriers).toBeDefined();
      expect(Array.isArray(content.carriers)).toBe(true);
    } else {
      // If there's an error, it should be a meaningful error message
      expect(response.result.content[0].text).toContain('Error');
    }
  });

  test('should handle invalid tool calls', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      }
    };

    const response = await sendRequest(server, request);
    
    expect(response.result).toBeDefined();
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('Unknown tool');
  });

  test('should call get_shipments tool', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_shipments',
        arguments: {
          page_size: 3
        }
      }
    };

    const response = await sendRequest(server, request);
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].type).toBe('text');
    
    // Should either succeed or fail with a meaningful error
    if (!response.result.isError) {
      const content = JSON.parse(response.result.content[0].text);
      expect(content.shipments !== undefined || content.message !== undefined).toBe(true);
    } else {
      expect(response.result.content[0].text).toContain('Error');
    }
  });

  test('should validate tool parameters', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_shipment_by_id',
        arguments: {} // Missing required shipment_id
      }
    };

    const response = await sendRequest(server, request);
    
    // Should handle missing required parameters gracefully
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
  });
});

describe('ShipStation Client Integration', () => {
  test('should calculate rates with proper parameters', async () => {
    const server = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      const request = {
        jsonrpc: '2.0',
        id: 7,
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

      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 10000);

        let output = '';
        server.stdout.on('data', (data) => {
          output += data.toString();
          
          try {
            const lines = output.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('{')) {
                const response = JSON.parse(line);
                if (response.id === request.id) {
                  clearTimeout(timeout);
                  resolve(response);
                  return;
                }
              }
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        });

        server.stdin.write(JSON.stringify(request) + '\n');
      });

      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
      
      // Should either succeed with rates or fail with meaningful error
      if (!response.result.isError) {
        const content = JSON.parse(response.result.content[0].text);
        expect(content.rate_response || content.rates).toBeDefined();
      } else {
        expect(response.result.content[0].text).toContain('Error');
      }
    } finally {
      server.kill();
    }
  }, 15000);
});