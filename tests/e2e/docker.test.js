#!/usr/bin/env node
/**
 * End-to-end tests for Docker deployment
 * Tests the MCP server running in Docker containers
 */
import { spawn } from 'child_process';
import { test, describe } from 'node:test';
import assert from 'node:assert';

const API_KEY = process.env.SHIPSTATION_API_KEY;

// Skip Docker tests if no API key or Docker not available
const checkDockerAvailable = () => {
  try {
    const result = spawn('docker', ['--version'], { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

if (!API_KEY || !checkDockerAvailable()) {
  console.log('⚠️  Skipping Docker E2E tests - Docker or API key not available');
  process.exit(0);
}

describe('Docker End-to-End Tests', () => {
  test('should run MCP server in Docker container', async () => {
    const dockerProcess = spawn('docker', [
      'run', '-i', '--rm',
      '--env', `SHIPSTATION_API_KEY=${API_KEY}`,
      'shipstation-mcp'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      // Give Docker container time to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      // Send request to Docker container
      dockerProcess.stdin.write(JSON.stringify(request) + '\n');

      // Wait for response
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Docker test timeout'));
        }, 10000);

        let output = '';
        dockerProcess.stdout.on('data', (data) => {
          output += data.toString();
          
          try {
            const lines = output.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('{')) {
                const response = JSON.parse(line);
                if (response.id === 1) {
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
      });

      assert.ok(response.result, 'Docker container should return result');
      assert.ok(response.result.tools, 'Should have tools list');
      assert.ok(Array.isArray(response.result.tools), 'Tools should be array');
      assert.ok(response.result.tools.length > 0, 'Should have tools available');

      console.log(`✅ Docker container working - ${response.result.tools.length} tools available`);
    } finally {
      dockerProcess.kill();
    }
  });

  test('should make API calls from Docker container', async () => {
    const dockerProcess = spawn('docker', [
      'run', '-i', '--rm',
      '--env', `SHIPSTATION_API_KEY=${API_KEY}`,
      'shipstation-mcp'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_carriers',
          arguments: { page_size: 2 }
        }
      };

      dockerProcess.stdin.write(JSON.stringify(request) + '\n');

      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Docker API test timeout'));
        }, 15000);

        let output = '';
        dockerProcess.stdout.on('data', (data) => {
          output += data.toString();
          
          try {
            const lines = output.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('{')) {
                const response = JSON.parse(line);
                if (response.id === 2) {
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
      });

      assert.ok(response.result, 'Docker container should return API result');
      assert.strictEqual(response.result.isError, undefined, 'Should not be an error');
      
      const content = JSON.parse(response.result.content[0].text);
      assert.ok(content.carriers, 'Should have carriers from API');
      assert.ok(Array.isArray(content.carriers), 'Carriers should be array');

      console.log(`✅ Docker API call successful - ${content.carriers.length} carriers retrieved`);
    } finally {
      dockerProcess.kill();
    }
  });
});

console.log('🐳 Running Docker End-to-End Tests...\n');