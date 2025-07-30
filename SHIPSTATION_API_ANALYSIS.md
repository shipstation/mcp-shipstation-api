# ShipStation API v2 Analysis & CLI Implementation Plan

## Overview

This document provides a comprehensive analysis of the ShipStation API v2 based on the OpenAPI YAML specification and outlines the implementation plan for a Node.js CLI tool.

## API Configuration

- **Title**: ShipStation API v2
- **Version**: 2.0.0
- **Base URL**: `https://api.shipstation.com`
- **Authentication**: API Key in `api-key` header
- **Format**: REST API with JSON responses
- **OpenAPI Version**: 3.1.0

## API Sections Overview

The ShipStation API v2 consists of 16 main sections, each providing specific functionality:

### 1. **Inventory** (`/v2/inventory`)
Manage stock levels, warehouses, and locations.

**Key Endpoints:**
- `GET /v2/inventory` - List SKU inventory levels
- `POST /v2/inventory` - Update SKU stock levels
- `GET /v2/inventory_warehouses` - List inventory warehouses
- `POST /v2/inventory_warehouses` - Create new inventory warehouse
- `GET /v2/inventory_warehouses/{id}` - Get warehouse by ID
- `PUT /v2/inventory_warehouses/{id}` - Update warehouse
- `DELETE /v2/inventory_warehouses/{id}` - Delete warehouse
- `GET /v2/inventory_locations` - List inventory locations
- `POST /v2/inventory_locations` - Create new inventory location
- `GET /v2/inventory_locations/{id}` - Get location by ID
- `PUT /v2/inventory_locations/{id}` - Update location
- `DELETE /v2/inventory_locations/{id}` - Delete location

**Features:**
- Transaction types: increment, decrement, adjust, modify
- Inventory conditions: sellable, damaged, expired, qa_hold
- Multi-location inventory tracking
- Cost and lot tracking
- Warehouse and location management

### 2. **Batches** (`/v2/batches`)
Bulk label processing for high-volume operations.

**Key Endpoints:**
- `GET /v2/batches` - List batches
- `POST /v2/batches` - Create new batch
- `GET /v2/batches/external_batch_id/{external_batch_id}` - Get batch by external ID
- `GET /v2/batches/{batch_id}` - Get batch by ID
- `PUT /v2/batches/{batch_id}` - Update batch
- `POST /v2/batches/{batch_id}/add` - Add items to batch
- `GET /v2/batches/{batch_id}/errors` - List batch errors
- `POST /v2/batches/{batch_id}/process/labels` - Process batch labels
- `POST /v2/batches/{batch_id}/remove` - Remove items from batch

**Features:**
- External batch ID support
- Batch error handling and reporting
- Add/remove shipments from batches
- Bulk label processing
- Batch status tracking

### 3. **Carriers** (`/v2/carriers`)
Manage carrier connections and configurations.

**Key Endpoints:**
- `GET /v2/carriers` - List carriers
- `GET /v2/carriers/{carrier_id}` - Get carrier details
- `GET /v2/carriers/{carrier_id}/options` - Get carrier options
- `GET /v2/carriers/{carrier_id}/packages` - List carrier package types
- `GET /v2/carriers/{carrier_id}/services` - List carrier services

**Features:**
- Carrier service management
- Package type configurations
- Carrier-specific options
- Service availability

### 4. **Downloads** (`/v2/downloads`)
File download system for labels, manifests, and forms.

**Key Endpoints:**
- `GET /v2/downloads/{dir}/{subdir}/{filename}` - Download files

**Features:**
- Multiple file formats: PDF, PNG, ZPL
- Rotation parameter support
- Structured download URLs
- Binary file handling

### 5. **Labels** (`/v2/labels`)
Core label creation and management functionality.

**Key Endpoints:**
- `GET /v2/labels` - List labels
- `POST /v2/labels` - Create new label
- `POST /v2/labels/rates/{rate_id}` - Create label from rate
- `POST /v2/labels/shipment/{shipment_id}` - Create label from shipment
- `GET /v2/labels/{label_id}` - Get label details
- `POST /v2/labels/{label_id}/return` - Create return label
- `GET /v2/labels/{label_id}/track` - Get label tracking
- `POST /v2/labels/{label_id}/void` - Void label

**Features:**
- Multiple label creation methods
- Return label support
- Label tracking integration
- Label voiding capabilities
- Various label formats and layouts

### 6. **Manifests** (`/v2/manifests`)
Manifest creation and management for carrier pickups.

**Key Endpoints:**
- `GET /v2/manifests` - List manifests
- `POST /v2/manifests` - Create new manifest
- `GET /v2/manifests/{manifest_id}` - Get manifest details

**Features:**
- Manifest creation for shipments
- Carrier-specific manifests
- Pickup documentation
- Manifest downloads

### 7. **Package Pickups** (`/v2/pickups`)
Schedule and manage carrier pickups.

**Key Endpoints:**
- `GET /v2/pickups` - List scheduled pickups
- `POST /v2/pickups` - Schedule new pickup
- `GET /v2/pickups/{pickup_id}` - Get pickup details
- `DELETE /v2/pickups/{pickup_id}` - Cancel pickup

**Features:**
- Pickup scheduling
- Pickup windows and timing
- Contact details management
- Pickup confirmation numbers

### 8. **Package Types** (`/v2/packages`)
Custom package type management.

**Key Endpoints:**
- `GET /v2/packages` - List package types
- `POST /v2/packages` - Create package type
- `GET /v2/packages/{package_id}` - Get package type details
- `PUT /v2/packages/{package_id}` - Update package type
- `DELETE /v2/packages/{package_id}` - Delete package type

**Features:**
- Custom package definitions
- Package dimensions and weights
- Package type configurations

### 9. **Products** (`/v2/products`)
Product catalog management.

**Key Endpoints:**
- `GET /v2/products` - List products

**Features:**
- Product catalog management
- Bundle component support
- SKU management
- Product attributes

### 10. **Rates** (`/v2/rates`)
Rate calculation and comparison across carriers.

**Key Endpoints:**
- `POST /v2/rates` - Calculate rates
- `POST /v2/rates/estimate` - Get rate estimates
- `GET /v2/rates/{rate_id}` - Get rate details

**Features:**
- Multi-carrier rate comparison
- Rate estimation
- Service-specific rates
- Rate details and breakdowns

### 11. **Shipments** (`/v2/shipments`)
Core shipment management functionality.

**Key Endpoints:**
- `GET /v2/shipments` - List shipments
- `POST /v2/shipments` - Create shipments
- `GET /v2/shipments/external_shipment_id/{external_shipment_id}` - Get by external ID
- `GET /v2/shipments/{shipment_id}` - Get shipment details
- `POST /v2/shipments/{shipment_id}/cancel` - Cancel shipment
- `GET /v2/shipments/{shipment_id}/rates` - Get shipment rates
- `POST /v2/shipments/{shipment_id}/tags/{tag_name}` - Tag shipment
- `DELETE /v2/shipments/{shipment_id}/tags/{tag_name}` - Remove tag

**Features:**
- Shipment creation and management
- External shipment ID support
- Shipment cancellation
- Rate retrieval for shipments
- Tagging system integration

### 12. **Tags** (`/v2/tags`)
Shipment organization and labeling system.

**Key Endpoints:**
- `GET /v2/tags` - List tags
- `POST /v2/tags` - Create new tag
- `DELETE /v2/tags/{tag_name}` - Delete tag

**Features:**
- Tag management
- Shipment organization
- Custom labeling system

### 13. **Tracking** (`/v2/tracking`)
Package tracking management.

**Key Endpoints:**
- `DELETE /v2/tracking/stop` - Stop tracking updates

**Features:**
- Tracking management
- Unsubscribe from tracking updates

### 14. **Users** (`/v2/users`)
User administration and management.

**Key Endpoints:**
- `GET /v2/users` - List users

**Features:**
- User management
- Account administration
- User status tracking (active, inactive, locked_out, email_lock)

### 15. **Warehouses** (`/v2/warehouses`)
Warehouse management and configuration.

**Key Endpoints:**
- `GET /v2/warehouses` - List warehouses
- `GET /v2/warehouses/{warehouse_id}` - Get warehouse details

**Features:**
- Warehouse management
- Multi-location support
- Warehouse configuration

### 16. **Webhooks** (`/v2/environment/webhooks`)
Event notification system for real-time updates.

**Key Endpoints:**
- `GET /v2/environment/webhooks` - List webhooks
- `POST /v2/environment/webhooks` - Create webhook
- `GET /v2/environment/webhooks/{webhook_id}` - Get webhook details
- `PUT /v2/environment/webhooks/{webhook_id}` - Update webhook
- `DELETE /v2/environment/webhooks/{webhook_id}` - Delete webhook

**Features:**
- Event subscription system
- Real-time notifications
- Webhook management
- Event types: batch, carrier_connected, track, etc.

## Common API Patterns

### Authentication
- **Method**: API Key authentication
- **Header**: `api-key: <your-api-key>`
- **Security Scheme**: `apiKey` in header

### Pagination
Standard pagination across all list endpoints:
```json
{
  "total": 100,
  "page": 1,
  "pages": 10,
  "links": {
    "first": { "href": "..." },
    "last": { "href": "..." },
    "prev": { "href": "..." },
    "next": { "href": "..." }
  }
}
```

### Error Handling
Comprehensive error response structure with:
- Error codes and messages
- Request ID for tracking
- Detailed error descriptions
- Field-specific validation errors

### File Downloads
Binary file support for:
- **PDF**: Labels, manifests, forms
- **PNG**: Label images
- **ZPL**: Zebra printer format

## Access Requirements

- **API Access**: Scale-Gold plan (US, CA) or Accelerate plan (UK, AU, NZ, EU) or higher
- **Inventory API**: Available as paid add-on for other plans
- **Rate Limits**: Standard API rate limiting applies

## Data Models

### Key Data Structures

#### Address
```json
{
  "name": "string",
  "phone": "string",
  "address_line1": "string",
  "city_locality": "string",
  "state_province": "string",
  "postal_code": "string",
  "country_code": "string",
  "address_residential_indicator": "string"
}
```

#### Package
```json
{
  "weight": {
    "value": "number",
    "unit": "string"
  },
  "dimensions": {
    "length": "number",
    "width": "number",
    "height": "number",
    "unit": "string"
  }
}
```

#### Rate
```json
{
  "rate_id": "string",
  "rate_type": "string",
  "carrier_id": "string",
  "service_code": "string",
  "shipping_amount": {
    "currency": "string",
    "amount": "number"
  },
  "insurance_amount": {
    "currency": "string",
    "amount": "number"
  }
}
```

This comprehensive analysis provides the foundation for implementing a complete ShipStation API v2 CLI tool that covers all available functionality.