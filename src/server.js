import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import ShipStationClient from './shipstation-client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;

if (!SHIPSTATION_API_KEY) {
  console.error('Error: SHIPSTATION_API_KEY environment variable is required');
  process.exit(1);
}

const shipstation = new ShipStationClient(SHIPSTATION_API_KEY);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'ShipStation API Server',
    version: '1.0.0',
    description: 'MVP server for interacting with ShipStation API v2',
    endpoints: {
      shipments: {
        'GET /api/shipments': 'List shipments',
        'POST /api/shipments': 'Create shipment',
        'GET /api/shipments/:id': 'Get shipment by ID',
        'GET /api/shipments/external/:externalId': 'Get shipment by external ID',
        'PUT /api/shipments/:id/cancel': 'Cancel shipment',
        'GET /api/shipments/:id/rates': 'Get shipment rates',
        'POST /api/shipments/:id/tags/:tagName': 'Tag shipment',
        'DELETE /api/shipments/:id/tags/:tagName': 'Remove tag from shipment'
      },
      labels: {
        'GET /api/labels': 'List labels',
        'POST /api/labels': 'Create label',
        'POST /api/labels/rates/:rateId': 'Create label from rate',
        'POST /api/labels/shipment/:shipmentId': 'Create label from shipment',
        'GET /api/labels/:id': 'Get label by ID',
        'POST /api/labels/:id/return': 'Create return label',
        'GET /api/labels/:id/track': 'Track label',
        'PUT /api/labels/:id/void': 'Void label'
      },
      rates: {
        'POST /api/rates': 'Calculate rates',
        'POST /api/rates/estimate': 'Estimate rates',
        'GET /api/rates/:id': 'Get rate by ID'
      },
      carriers: {
        'GET /api/carriers': 'List carriers',
        'GET /api/carriers/:id': 'Get carrier by ID',
        'GET /api/carriers/:id/options': 'Get carrier options',
        'GET /api/carriers/:id/services': 'Get carrier services',
        'GET /api/carriers/:id/packages': 'Get carrier package types'
      },
      inventory: {
        'GET /api/inventory': 'Get inventory levels',
        'POST /api/inventory': 'Update inventory'
      },
      inventory_warehouses: {
        'GET /api/inventory-warehouses': 'List inventory warehouses',
        'POST /api/inventory-warehouses': 'Create inventory warehouse',
        'GET /api/inventory-warehouses/:id': 'Get inventory warehouse by ID',
        'PUT /api/inventory-warehouses/:id': 'Update inventory warehouse',
        'DELETE /api/inventory-warehouses/:id': 'Delete inventory warehouse'
      },
      inventory_locations: {
        'GET /api/inventory-locations': 'List inventory locations',
        'POST /api/inventory-locations': 'Create inventory location',
        'GET /api/inventory-locations/:id': 'Get inventory location by ID',
        'PUT /api/inventory-locations/:id': 'Update inventory location',
        'DELETE /api/inventory-locations/:id': 'Delete inventory location'
      },
      batches: {
        'GET /api/batches': 'List batches',
        'POST /api/batches': 'Create batch',
        'GET /api/batches/external/:externalId': 'Get batch by external ID',
        'GET /api/batches/:id': 'Get batch by ID',
        'PUT /api/batches/:id': 'Update batch',
        'DELETE /api/batches/:id': 'Delete batch',
        'POST /api/batches/:id/add': 'Add to batch',
        'GET /api/batches/:id/errors': 'Get batch errors',
        'POST /api/batches/:id/process': 'Process batch',
        'POST /api/batches/:id/remove': 'Remove from batch'
      },
      manifests: {
        'GET /api/manifests': 'List manifests',
        'POST /api/manifests': 'Create manifest',
        'GET /api/manifests/:id': 'Get manifest by ID'
      },
      packages: {
        'GET /api/packages': 'List package types',
        'POST /api/packages': 'Create package type',
        'GET /api/packages/:id': 'Get package type by ID',
        'PUT /api/packages/:id': 'Update package type',
        'DELETE /api/packages/:id': 'Delete package type'
      },
      pickups: {
        'GET /api/pickups': 'List scheduled pickups',
        'POST /api/pickups': 'Schedule pickup',
        'GET /api/pickups/:id': 'Get pickup by ID',
        'DELETE /api/pickups/:id': 'Cancel pickup'
      },
      tags: {
        'GET /api/tags': 'List tags',
        'POST /api/tags': 'Create tag',
        'DELETE /api/tags/:name': 'Delete tag'
      },
      webhooks: {
        'GET /api/webhooks': 'List webhooks',
        'POST /api/webhooks': 'Create webhook',
        'GET /api/webhooks/:id': 'Get webhook by ID',
        'PUT /api/webhooks/:id': 'Update webhook',
        'DELETE /api/webhooks/:id': 'Delete webhook'
      },
      warehouses: {
        'GET /api/warehouses': 'List warehouses',
        'GET /api/warehouses/:id': 'Get warehouse by ID'
      },
      users: {
        'GET /api/users': 'List users'
      },
      products: {
        'GET /api/products': 'List products'
      },
      tracking: {
        'POST /api/tracking/stop': 'Stop tracking updates'
      }
    }
  });
});

// Shipments endpoints
app.get('/api/shipments', asyncHandler(async (req, res) => {
  const data = await shipstation.getShipments(req.query);
  res.json(data);
}));

app.post('/api/shipments', asyncHandler(async (req, res) => {
  const data = await shipstation.createShipment(req.body);
  res.status(201).json(data);
}));

app.get('/api/shipments/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getShipmentById(req.params.id);
  res.json(data);
}));

app.get('/api/shipments/external/:externalId', asyncHandler(async (req, res) => {
  const data = await shipstation.getShipmentByExternalId(req.params.externalId);
  res.json(data);
}));

app.put('/api/shipments/:id/cancel', asyncHandler(async (req, res) => {
  const data = await shipstation.cancelShipment(req.params.id);
  res.json(data);
}));

app.get('/api/shipments/:id/rates', asyncHandler(async (req, res) => {
  const data = await shipstation.getShipmentRates(req.params.id);
  res.json(data);
}));

// Labels endpoints
app.get('/api/labels', asyncHandler(async (req, res) => {
  const data = await shipstation.getLabels(req.query);
  res.json(data);
}));

app.post('/api/labels', asyncHandler(async (req, res) => {
  const data = await shipstation.createLabel(req.body);
  res.status(201).json(data);
}));

app.post('/api/labels/rates/:rateId', asyncHandler(async (req, res) => {
  const data = await shipstation.createLabelFromRate(req.params.rateId, req.body);
  res.status(201).json(data);
}));

app.post('/api/labels/shipment/:shipmentId', asyncHandler(async (req, res) => {
  const data = await shipstation.createLabelFromShipment(req.params.shipmentId, req.body);
  res.status(201).json(data);
}));

app.get('/api/labels/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getLabelById(req.params.id);
  res.json(data);
}));

app.put('/api/labels/:id/void', asyncHandler(async (req, res) => {
  const data = await shipstation.voidLabel(req.params.id);
  res.json(data);
}));

app.get('/api/labels/:id/track', asyncHandler(async (req, res) => {
  const data = await shipstation.trackLabel(req.params.id);
  res.json(data);
}));

// Rates endpoints
app.post('/api/rates', asyncHandler(async (req, res) => {
  const data = await shipstation.calculateRates(req.body);
  res.json(data);
}));

app.post('/api/rates/estimate', asyncHandler(async (req, res) => {
  const data = await shipstation.estimateRates(req.body);
  res.json(data);
}));

app.get('/api/rates/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getRateById(req.params.id);
  res.json(data);
}));

// Carriers endpoints
app.get('/api/carriers', asyncHandler(async (req, res) => {
  const data = await shipstation.getCarriers(req.query);
  res.json(data);
}));

app.get('/api/carriers/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getCarrierById(req.params.id);
  res.json(data);
}));

app.get('/api/carriers/:id/services', asyncHandler(async (req, res) => {
  const data = await shipstation.getCarrierServices(req.params.id);
  res.json(data);
}));

app.get('/api/carriers/:id/packages', asyncHandler(async (req, res) => {
  const data = await shipstation.getCarrierPackageTypes(req.params.id);
  res.json(data);
}));

app.get('/api/carriers/:id/options', asyncHandler(async (req, res) => {
  const data = await shipstation.getCarrierOptions(req.params.id);
  res.json(data);
}));

// Inventory endpoints
app.get('/api/inventory', asyncHandler(async (req, res) => {
  const data = await shipstation.getInventoryLevels(req.query);
  res.json(data);
}));

app.post('/api/inventory', asyncHandler(async (req, res) => {
  const data = await shipstation.updateInventory(req.body);
  res.json(data);
}));

// Warehouses endpoints
app.get('/api/warehouses', asyncHandler(async (req, res) => {
  const data = await shipstation.getWarehouses(req.query);
  res.json(data);
}));

app.get('/api/warehouses/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getWarehouseById(req.params.id);
  res.json(data);
}));

// Inventory Warehouses endpoints
app.get('/api/inventory-warehouses', asyncHandler(async (req, res) => {
  const data = await shipstation.getInventoryWarehouses(req.query);
  res.json(data);
}));

app.post('/api/inventory-warehouses', asyncHandler(async (req, res) => {
  const data = await shipstation.createInventoryWarehouse(req.body);
  res.status(201).json(data);
}));

app.get('/api/inventory-warehouses/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getInventoryWarehouseById(req.params.id);
  res.json(data);
}));

app.put('/api/inventory-warehouses/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.updateInventoryWarehouse(req.params.id, req.body);
  res.json(data);
}));

app.delete('/api/inventory-warehouses/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.deleteInventoryWarehouse(req.params.id);
  res.json(data);
}));

// Inventory Locations endpoints
app.get('/api/inventory-locations', asyncHandler(async (req, res) => {
  const data = await shipstation.getInventoryLocations(req.query);
  res.json(data);
}));

app.post('/api/inventory-locations', asyncHandler(async (req, res) => {
  const data = await shipstation.createInventoryLocation(req.body);
  res.status(201).json(data);
}));

app.get('/api/inventory-locations/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getInventoryLocationById(req.params.id);
  res.json(data);
}));

app.put('/api/inventory-locations/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.updateInventoryLocation(req.params.id, req.body);
  res.json(data);
}));

app.delete('/api/inventory-locations/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.deleteInventoryLocation(req.params.id);
  res.json(data);
}));

// Batch endpoints
app.get('/api/batches', asyncHandler(async (req, res) => {
  const data = await shipstation.getBatches(req.query);
  res.json(data);
}));

app.post('/api/batches', asyncHandler(async (req, res) => {
  const data = await shipstation.createBatch(req.body);
  res.status(201).json(data);
}));

app.get('/api/batches/external/:externalId', asyncHandler(async (req, res) => {
  const data = await shipstation.getBatchByExternalId(req.params.externalId);
  res.json(data);
}));

app.get('/api/batches/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getBatchById(req.params.id);
  res.json(data);
}));

app.put('/api/batches/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.updateBatch(req.params.id, req.body);
  res.json(data);
}));

app.delete('/api/batches/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.deleteBatch(req.params.id);
  res.json(data);
}));

app.post('/api/batches/:id/add', asyncHandler(async (req, res) => {
  const data = await shipstation.addToBatch(req.params.id, req.body);
  res.json(data);
}));

app.get('/api/batches/:id/errors', asyncHandler(async (req, res) => {
  const data = await shipstation.getBatchErrors(req.params.id);
  res.json(data);
}));

app.post('/api/batches/:id/process', asyncHandler(async (req, res) => {
  const data = await shipstation.processBatch(req.params.id, req.body);
  res.json(data);
}));

app.post('/api/batches/:id/remove', asyncHandler(async (req, res) => {
  const data = await shipstation.removeFromBatch(req.params.id, req.body);
  res.json(data);
}));

// Manifest endpoints
app.get('/api/manifests', asyncHandler(async (req, res) => {
  const data = await shipstation.getManifests(req.query);
  res.json(data);
}));

app.post('/api/manifests', asyncHandler(async (req, res) => {
  const data = await shipstation.createManifest(req.body);
  res.status(201).json(data);
}));

app.get('/api/manifests/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getManifestById(req.params.id);
  res.json(data);
}));

// Package Type endpoints
app.get('/api/packages', asyncHandler(async (req, res) => {
  const data = await shipstation.getPackageTypes(req.query);
  res.json(data);
}));

app.post('/api/packages', asyncHandler(async (req, res) => {
  const data = await shipstation.createPackageType(req.body);
  res.status(201).json(data);
}));

app.get('/api/packages/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getPackageTypeById(req.params.id);
  res.json(data);
}));

app.put('/api/packages/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.updatePackageType(req.params.id, req.body);
  res.json(data);
}));

app.delete('/api/packages/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.deletePackageType(req.params.id);
  res.json(data);
}));

// Pickup endpoints
app.get('/api/pickups', asyncHandler(async (req, res) => {
  const data = await shipstation.getPickups(req.query);
  res.json(data);
}));

app.post('/api/pickups', asyncHandler(async (req, res) => {
  const data = await shipstation.schedulePickup(req.body);
  res.status(201).json(data);
}));

app.get('/api/pickups/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getPickupById(req.params.id);
  res.json(data);
}));

app.delete('/api/pickups/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.cancelPickup(req.params.id);
  res.json(data);
}));

// Return Label endpoint
app.post('/api/labels/:id/return', asyncHandler(async (req, res) => {
  const data = await shipstation.createReturnLabel(req.params.id, req.body);
  res.status(201).json(data);
}));

// Shipment Tagging endpoints
app.post('/api/shipments/:id/tags/:tagName', asyncHandler(async (req, res) => {
  const data = await shipstation.tagShipment(req.params.id, req.params.tagName);
  res.json(data);
}));

app.delete('/api/shipments/:id/tags/:tagName', asyncHandler(async (req, res) => {
  const data = await shipstation.untagShipment(req.params.id, req.params.tagName);
  res.json(data);
}));

// Tags endpoints
app.get('/api/tags', asyncHandler(async (req, res) => {
  const data = await shipstation.getTags(req.query);
  res.json(data);
}));

app.post('/api/tags', asyncHandler(async (req, res) => {
  const data = await shipstation.createTag(req.body);
  res.status(201).json(data);
}));

app.delete('/api/tags/:name', asyncHandler(async (req, res) => {
  const data = await shipstation.deleteTag(req.params.name);
  res.json(data);
}));

// Tracking endpoints
app.post('/api/tracking/stop', asyncHandler(async (req, res) => {
  const data = await shipstation.stopTracking(req.body);
  res.json(data);
}));

// Webhook endpoints
app.get('/api/webhooks', asyncHandler(async (req, res) => {
  const data = await shipstation.getWebhooks(req.query);
  res.json(data);
}));

app.post('/api/webhooks', asyncHandler(async (req, res) => {
  const data = await shipstation.createWebhook(req.body);
  res.status(201).json(data);
}));

app.get('/api/webhooks/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.getWebhookById(req.params.id);
  res.json(data);
}));

app.put('/api/webhooks/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.updateWebhook(req.params.id, req.body);
  res.json(data);
}));

app.delete('/api/webhooks/:id', asyncHandler(async (req, res) => {
  const data = await shipstation.deleteWebhook(req.params.id);
  res.json(data);
}));

// Users and Products endpoints
app.get('/api/users', asyncHandler(async (req, res) => {
  const data = await shipstation.getUsers(req.query);
  res.json(data);
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  const data = await shipstation.getProducts(req.query);
  res.json(data);
}));

// File download endpoint
app.get('/api/download/*', asyncHandler(async (req, res) => {
  const filePath = req.params[0];
  const rotation = req.query.rotation;
  
  const fileData = await shipstation.downloadFile(filePath, rotation);
  
  // Determine content type based on file extension
  let contentType = 'application/octet-stream';
  if (filePath.endsWith('.pdf')) {
    contentType = 'application/pdf';
  } else if (filePath.endsWith('.png')) {
    contentType = 'image/png';
  } else if (filePath.endsWith('.zpl')) {
    contentType = 'text/plain';
  }
  
  res.set('Content-Type', contentType);
  res.send(Buffer.from(fileData));
}));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  if (error.message.includes('ShipStation API Error')) {
    const match = error.message.match(/ShipStation API Error (\d+):/);
    if (match) {
      statusCode = parseInt(match[1]);
    }
    message = error.message;
  }
  
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`ShipStation API Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API documentation`);
});