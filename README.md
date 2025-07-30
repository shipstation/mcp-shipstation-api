# ShipStation API MCP Server

An MCP (Model Context Protocol) server for interacting with the ShipStation API v2. This server provides tools for AI assistants to interact with ShipStation functionality including shipments, labels, rates, carriers, inventory, and warehouses.

The server includes both:
- **MCP Server**: For AI assistant integration via Model Context Protocol
- **REST API Server**: Traditional HTTP API interface (legacy)

## Features

- **Shipments**: Create, list, get, cancel shipments and retrieve rates
- **Labels**: Create, list, get, void labels and track packages
- **Rates**: Calculate and estimate shipping rates
- **Carriers**: List carriers, services, and package types
- **Inventory**: Get inventory levels and update stock
- **Warehouses**: List and get warehouse information
- **File Downloads**: Download labels, manifests, and other files

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your ShipStation API key
   ```

3. **Start the MCP server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Start the REST API server** (optional):
   ```bash
   npm run start-express
   # or for development:
   npm run dev-express
   ```

## MCP Integration

To use this server with an MCP-compatible AI assistant (like Claude Desktop), add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "shipstation": {
      "command": "node",
      "args": ["/path/to/shipstation-api-mcp/src/mcp-server.js"],
      "env": {
        "SHIPSTATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Environment Variables

- `SHIPSTATION_API_KEY` - Your ShipStation API key (required)
- `PORT` - Server port (default: 3000, for REST API only)

## MCP Tools

The MCP server provides the following tools for AI assistants:

### Shipment Tools
- `get_shipments` - List shipments with optional filtering
- `create_shipment` - Create a new shipment
- `get_shipment_by_id` - Get shipment details by ID
- `cancel_shipment` - Cancel a shipment

### Label Tools
- `get_labels` - List shipping labels
- `create_label` - Create a new shipping label
- `get_label_by_id` - Get label details by ID
- `void_label` - Void a shipping label
- `track_package` - Track a package using label ID

### Rate Tools
- `calculate_rates` - Calculate shipping rates for a shipment

### Carrier Tools
- `get_carriers` - List available carriers
- `get_carrier_services` - Get services for a specific carrier

### Warehouse & Inventory Tools
- `get_warehouses` - List warehouses
- `get_inventory` - Get inventory levels

## API Endpoints

### Shipments
- `GET /api/shipments` - List shipments
- `POST /api/shipments` - Create shipment
- `GET /api/shipments/:id` - Get shipment by ID
- `GET /api/shipments/external/:externalId` - Get by external ID
- `POST /api/shipments/:id/cancel` - Cancel shipment
- `GET /api/shipments/:id/rates` - Get shipment rates

### Labels
- `GET /api/labels` - List labels
- `POST /api/labels` - Create label
- `POST /api/labels/rates/:rateId` - Create label from rate
- `POST /api/labels/shipment/:shipmentId` - Create label from shipment
- `GET /api/labels/:id` - Get label by ID
- `POST /api/labels/:id/void` - Void label
- `GET /api/labels/:id/track` - Track label

### Rates
- `POST /api/rates` - Calculate rates
- `POST /api/rates/estimate` - Estimate rates
- `GET /api/rates/:id` - Get rate by ID

### Carriers
- `GET /api/carriers` - List carriers
- `GET /api/carriers/:id` - Get carrier by ID
- `GET /api/carriers/:id/services` - Get carrier services
- `GET /api/carriers/:id/packages` - Get carrier package types

### Inventory
- `GET /api/inventory` - Get inventory levels
- `POST /api/inventory` - Update inventory

### Warehouses
- `GET /api/warehouses` - List warehouses
- `GET /api/warehouses/:id` - Get warehouse by ID

### File Downloads
- `GET /api/download/*` - Download files (labels, manifests, etc.)

## Example Usage

### Create a Shipment
```javascript
const shipment = {
  shipment: {
    carrier_id: "se-123456",
    service_code: "usps_priority_mail",
    external_shipment_id: "order-12345",
    ship_date: "2024-01-15",
    ship_to: {
      name: "John Doe",
      address_line1: "123 Main St",
      city_locality: "Austin",
      state_province: "TX",
      postal_code: "78701",
      country_code: "US"
    },
    ship_from: {
      name: "Your Company",
      address_line1: "456 Business Ave",
      city_locality: "Austin", 
      state_province: "TX",
      postal_code: "78701",
      country_code: "US"
    },
    packages: [{
      weight: {
        value: 1.5,
        unit: "pound"
      },
      dimensions: {
        unit: "inch",
        length: 10,
        width: 8,
        height: 6
      }
    }]
  }
};

const response = await fetch('http://localhost:3000/api/shipments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(shipment)
});
```

### Calculate Rates
```javascript
const rateRequest = {
  rate_options: {
    carrier_ids: ["se-123456"]
  },
  shipment: {
    ship_to: {
      city_locality: "Austin",
      state_province: "TX", 
      postal_code: "78701",
      country_code: "US"
    },
    ship_from: {
      city_locality: "Los Angeles",
      state_province: "CA",
      postal_code: "90210", 
      country_code: "US"
    },
    packages: [{
      weight: { value: 2, unit: "pound" },
      dimensions: { unit: "inch", length: 10, width: 8, height: 6 }
    }]
  }
};

const response = await fetch('http://localhost:3000/api/rates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(rateRequest)
});
```

## Testing

The project includes comprehensive tests organized by category:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests (fast, no API key needed)
npm run test:integration   # Integration tests (requires API key)  
npm run test:e2e          # End-to-end Docker tests

# Watch mode for development
npm run test:watch
```

**Note:** Integration and E2E tests require `SHIPSTATION_API_KEY` environment variable.

## Requirements

- Node.js 16+
- ShipStation API key (Scale-Gold plan or higher)
- Docker (optional, for containerized deployment)

## Notes

- This is an MVP implementation covering core ShipStation API functionality
- Error handling includes proper HTTP status codes and descriptive messages
- All endpoints proxy to the official ShipStation API v2
- File downloads are supported for labels, manifests, and other documents
- CORS is enabled for cross-origin requests
- Comprehensive test suite with unit, integration, and E2E tests