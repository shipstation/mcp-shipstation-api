# ShipStation API MCP Server

An MCP (Model Context Protocol) server for interacting with the ShipStation API v2. This server provides tools for AI assistants to interact with ShipStation functionality including shipments, labels, rates, carriers, inventory, warehouses, batches, and manifests.

## Features

- **Shipments**: Create, list, get, cancel shipments and retrieve rates
- **Labels**: Create, list, get, void labels and track packages
- **Rates**: Calculate and estimate shipping rates
- **Carriers**: List carriers, services, and package types
- **Inventory**: Get inventory levels and update stock
- **Warehouses**: List and get warehouse information
- **Batches**: Create and manage batches for bulk label processing
- **Manifests**: Create and manage manifests for end-of-day processing

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your ShipStation API key
   # NEVER commit .env to git - it contains sensitive API keys
   ```

3. **Start the MCP server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
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

⚠️ **Security Note**: Never commit your `.env` file to git. The `.env` file contains sensitive API keys and should only exist locally or in secure deployment environments.

## MCP Tools

The MCP server provides the following tools for AI assistants:

### Shipment Tools
- `get_shipments` - List shipments with optional filtering
- `create_shipment` - Create a new shipment
- `create_shipments_bulk` - Create multiple shipments in a single API call for bulk processing
- `get_shipment_by_id` - Get shipment details by ID
- `get_shipment_by_external_id` - Get shipment by external ID
- `update_shipment` - Update a shipment by its ID
- `cancel_shipment` - Cancel a shipment
- `get_shipment_rates` - Get rates for an existing shipment
- `tag_shipment` - Add a tag to a shipment
- `untag_shipment` - Remove a tag from a shipment

### Label Tools
- `get_labels` - List shipping labels
- `create_label` - Create a new shipping label
- `create_label_from_rate` - Create a label from an existing rate
- `create_label_from_shipment` - Create a label from an existing shipment
- `create_return_label` - Create a return label for an existing label
- `get_label_by_id` - Get label details by ID
- `void_label` - Void a shipping label
- `track_package` - Track a package using label ID

### Rate Tools
- `calculate_rates` - Calculate shipping rates for a shipment
- `estimate_rates` - Estimate shipping rates with minimal address information
- `get_rate_by_id` - Get rate details by ID

### Carrier Tools
- `get_carriers` - List available carriers
- `get_carrier_by_id` - Get carrier details by ID
- `get_carrier_services` - Get services for a specific carrier
- `get_carrier_options` - Get carrier-specific options
- `get_carrier_package_types` - Get package types for a specific carrier

### Warehouse & Inventory Tools
- `get_warehouses` - List warehouses
- `get_warehouse_by_id` - Get warehouse details by ID
- `get_inventory` - Get inventory levels
- `update_inventory` - Update SKU stock levels
- `get_inventory_warehouses` - Get inventory warehouses
- `create_inventory_warehouse` - Create a new inventory warehouse
- `get_inventory_warehouse_by_id` - Get inventory warehouse by ID
- `update_inventory_warehouse` - Update inventory warehouse
- `delete_inventory_warehouse` - Delete inventory warehouse
- `get_inventory_locations` - Get inventory locations
- `create_inventory_location` - Create a new inventory location
- `get_inventory_location_by_id` - Get inventory location by ID
- `update_inventory_location` - Update inventory location
- `delete_inventory_location` - Delete inventory location

### Batch Tools
- `get_batches` - List batches with filtering parameters
- `create_batch` - Create a new batch for bulk label processing
- `get_batch_by_id` - Get batch details by ID
- `get_batch_by_external_id` - Get batch by external batch ID
- `update_batch` - Update batch information
- `delete_batch` - Delete a batch
- `add_to_batch` - Add shipments to an existing batch
- `remove_from_batch` - Remove items from a batch
- `get_batch_errors` - Get validation errors for a batch
- `process_batch` - Process a batch to create labels

### Manifest Tools
- `get_manifests` - List manifests with filtering parameters
- `create_manifest` - Create a new manifest for end-of-day processing
- `get_manifest_by_id` - Get manifest details by ID

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

## Security

🔒 **API Key Protection**: 
- The `.env` file is automatically ignored by git (see `.gitignore`)
- Never commit API keys to version control
- Use environment variables in production deployments
- Rotate API keys if accidentally exposed

🐳 **Docker Security**:
- Containers run as non-root user (`mcp`)
- API keys passed via environment variables only
- No secrets baked into images

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