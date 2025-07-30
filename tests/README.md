# Tests

This directory contains organized tests for the ShipStation MCP Server.

## Test Structure

```
tests/
├── unit/               # Unit tests (no external dependencies)
│   └── mcp-server.test.js
├── integration/        # Integration tests (requires API key)
│   └── shipstation-api.test.js
├── e2e/               # End-to-end tests (requires Docker)
│   └── docker.test.js
├── run-tests.js       # Test runner script
└── README.md          # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests (requires API key)
npm run test:e2e          # End-to-end Docker tests
```

### Watch Mode
```bash
npm run test:watch        # Re-run tests when files change
```

## Test Types

### Unit Tests (`tests/unit/`)
- Test MCP server functionality without external dependencies
- Mock API responses where needed
- Fast execution, no API key required
- Always run in CI/CD

**What they test:**
- MCP protocol compliance
- Tool discovery
- Error handling
- Request/response formatting

### Integration Tests (`tests/integration/`)
- Test real API integration with ShipStation
- Require `SHIPSTATION_API_KEY` environment variable
- Test actual network calls and data parsing

**What they test:**
- Real ShipStation API connectivity
- Data retrieval and parsing
- API error handling
- Authentication

### End-to-End Tests (`tests/e2e/`)
- Test complete Docker deployment
- Require Docker and `SHIPSTATION_API_KEY`
- Test the full stack in production-like environment

**What they test:**
- Docker container functionality
- API calls from within container
- Production deployment scenarios

## Environment Variables

### Required for Integration/E2E Tests
```bash
export SHIPSTATION_API_KEY="your_api_key_here"
```

### Optional
```bash
export NODE_ENV="test"        # Test environment
export DEBUG="*"              # Enable debug logging
```

## Test Examples

### Running Unit Tests Only
```bash
# Quick feedback loop during development
npm run test:unit
```

### Running Integration Tests
```bash
# Test real API integration
export SHIPSTATION_API_KEY="your_key"
npm run test:integration
```

### Running Docker E2E Tests
```bash
# Test Docker deployment (requires built image)
docker build -t shipstation-mcp .
export SHIPSTATION_API_KEY="your_key"
npm run test:e2e
```

## Adding New Tests

### Unit Test Example
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('New Feature', () => {
  test('should do something', async () => {
    // Test implementation
    assert.ok(true);
  });
});
```

### Integration Test Guidelines
- Always check for API key availability
- Use realistic test data
- Handle API rate limits gracefully
- Clean up any test data created

### E2E Test Guidelines
- Check for Docker availability
- Use container timeouts appropriately
- Test realistic user scenarios
- Verify container cleanup

## Test Data

The tests use your actual ShipStation account data:
- Real carriers, services, and warehouses
- Live API responses
- No test/sandbox mode (ShipStation doesn't provide one)

**Note:** Integration and E2E tests make real API calls. Be mindful of rate limits and any costs associated with API usage.

## Troubleshooting

### Tests Timeout
- Increase timeout values for slow network connections
- Check if ShipStation API is accessible
- Verify API key is valid

### Docker Tests Fail
- Ensure Docker is running: `docker --version`
- Build the image first: `docker build -t shipstation-mcp .`
- Check container logs for errors

### API Tests Fail
- Verify API key is correct and active
- Check network connectivity to api.shipstation.com
- Review ShipStation API status page

### Permission Errors
- Ensure test files are executable: `chmod +x tests/**/*.js`
- Check file ownership and permissions