#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import ShipStationClient from './shipstation-client.js';

dotenv.config();

const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;

if (!SHIPSTATION_API_KEY) {
  console.error('Error: SHIPSTATION_API_KEY environment variable is required');
  process.exit(1);
}

const shipstation = new ShipStationClient(SHIPSTATION_API_KEY);

class ShipStationMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'shipstation-api-server',
        version: '1.0.0',
        description: 'MCP server for interacting with ShipStation API v2'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Shipment tools
          {
            name: 'get_shipments',
            description: 'List shipments with optional filtering parameters',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number for pagination' },
                page_size: { type: 'number', description: 'Number of items per page' },
                status: { type: 'string', description: 'Filter by shipment status' },
                external_shipment_id: { type: 'string', description: 'Filter by external shipment ID' }
              }
            }
          },
          {
            name: 'create_shipment',
            description: 'Create a new shipment',
            inputSchema: {
              type: 'object',
              properties: {
                shipment: {
                  type: 'object',
                  required: ['ship_to', 'ship_from', 'packages'],
                  properties: {
                    carrier_id: { type: 'string', description: 'Carrier ID' },
                    service_code: { type: 'string', description: 'Service code' },
                    external_shipment_id: { type: 'string', description: 'External shipment ID' },
                    ship_date: { type: 'string', description: 'Ship date (YYYY-MM-DD)' },
                    create_sales_order: { type: 'boolean', description: 'Whether to create a sales order for this shipment', default: false },
                    store_id: { type: 'string', description: 'Store ID associated with the shipment' },
                    notes_from_buyer: { type: 'string', description: 'Notes from the buyer' },
                    notes_for_gift: { type: 'string', description: 'Gift notes' },
                    is_gift: { type: 'boolean', description: 'Indicates if the shipment is a gift', default: false },
                    validate_address: { type: 'string', description: 'Address validation option', enum: ['no_validation', 'validate_only', 'validate_and_clean'] },
                    ship_to: {
                      type: 'object',
                      required: ['name', 'address_line1', 'city_locality', 'state_province', 'postal_code', 'country_code'],
                      properties: {
                        name: { type: 'string' },
                        address_line1: { type: 'string' },
                        address_line2: { type: 'string' },
                        city_locality: { type: 'string' },
                        state_province: { type: 'string' },
                        postal_code: { type: 'string' },
                        country_code: { type: 'string' }
                      }
                    },
                    ship_from: {
                      type: 'object',
                      required: ['name', 'address_line1', 'city_locality', 'state_province', 'postal_code', 'country_code'],
                      properties: {
                        name: { type: 'string' },
                        address_line1: { type: 'string' },
                        address_line2: { type: 'string' },
                        city_locality: { type: 'string' },
                        state_province: { type: 'string' },
                        postal_code: { type: 'string' },
                        country_code: { type: 'string' }
                      }
                    },
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          weight: {
                            type: 'object',
                            properties: {
                              value: { type: 'number' },
                              unit: { type: 'string', enum: ['pound', 'ounce', 'kilogram', 'gram'] }
                            }
                          },
                          dimensions: {
                            type: 'object',
                            properties: {
                              unit: { type: 'string', enum: ['inch', 'centimeter'] },
                              length: { type: 'number' },
                              width: { type: 'number' },
                              height: { type: 'number' }
                            }
                          }
                        }
                      }
                    },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: 'Item name' },
                          sku: { type: 'string', description: 'Item SKU' },
                          quantity: { type: 'number', description: 'Item quantity' },
                          unit_price: { 
                            type: 'number', 
                            description: 'Unit price of the item' 
                          }
                        }
                      },
                      description: 'Items in the shipment (useful for sales orders)'
                    }
                  }
                }
              },
              required: ['shipment']
            }
          },
          {
            name: 'get_shipment_by_id',
            description: 'Get a shipment by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                shipment_id: { type: 'string', description: 'The shipment ID' }
              },
              required: ['shipment_id']
            }
          },
          {
            name: 'cancel_shipment',
            description: 'Cancel a shipment',
            inputSchema: {
              type: 'object',
              properties: {
                shipment_id: { type: 'string', description: 'The shipment ID to cancel' }
              },
              required: ['shipment_id']
            }
          },
          // Label tools
          {
            name: 'get_labels',
            description: 'List labels with optional filtering parameters',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number for pagination' },
                page_size: { type: 'number', description: 'Number of items per page' },
                status: { type: 'string', description: 'Filter by label status' },
                shipment_id: { type: 'string', description: 'Filter by shipment ID' }
              }
            }
          },
          {
            name: 'create_label',
            description: 'Create a new shipping label',
            inputSchema: {
              type: 'object',
              properties: {
                shipment: {
                  type: 'object',
                  required: ['ship_to', 'ship_from', 'packages'],
                  properties: {
                    carrier_id: { type: 'string', description: 'Carrier ID' },
                    service_code: { type: 'string', description: 'Service code' },
                    external_shipment_id: { type: 'string', description: 'External shipment ID' },
                    ship_date: { type: 'string', description: 'Ship date (YYYY-MM-DD)' },
                    create_sales_order: { type: 'boolean', description: 'Whether to create a sales order for this label', default: false },
                    store_id: { type: 'string', description: 'Store ID associated with the label' },
                    validate_address: { type: 'string', description: 'Address validation option', enum: ['no_validation', 'validate_only', 'validate_and_clean'] },
                    ship_to: {
                      type: 'object',
                      required: ['name', 'address_line1', 'city_locality', 'state_province', 'postal_code', 'country_code'],
                      properties: {
                        name: { type: 'string' },
                        address_line1: { type: 'string' },
                        address_line2: { type: 'string' },
                        city_locality: { type: 'string' },
                        state_province: { type: 'string' },
                        postal_code: { type: 'string' },
                        country_code: { type: 'string' }
                      }
                    },
                    ship_from: {
                      type: 'object',
                      required: ['name', 'address_line1', 'city_locality', 'state_province', 'postal_code', 'country_code'],
                      properties: {
                        name: { type: 'string' },
                        address_line1: { type: 'string' },
                        address_line2: { type: 'string' },
                        city_locality: { type: 'string' },
                        state_province: { type: 'string' },
                        postal_code: { type: 'string' },
                        country_code: { type: 'string' }
                      }
                    },
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          weight: {
                            type: 'object',
                            properties: {
                              value: { type: 'number' },
                              unit: { type: 'string', enum: ['pound', 'ounce', 'kilogram', 'gram'] }
                            }
                          },
                          dimensions: {
                            type: 'object',
                            properties: {
                              unit: { type: 'string', enum: ['inch', 'centimeter'] },
                              length: { type: 'number' },
                              width: { type: 'number' },
                              height: { type: 'number' }
                            }
                          }
                        }
                      }
                    },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: 'Item name' },
                          sku: { type: 'string', description: 'Item SKU' },
                          quantity: { type: 'number', description: 'Item quantity' },
                          unit_price: { 
                            type: 'number', 
                            description: 'Unit price of the item' 
                          }
                        }
                      },
                      description: 'Items in the label (useful for sales orders)'
                    }
                  }
                },
                label_format: { type: 'string', description: 'Label format (pdf, png, zpl)', enum: ['pdf', 'png', 'zpl'] },
                label_layout: { type: 'string', description: 'Label layout' }
              },
              required: ['shipment']
            }
          },
          {
            name: 'get_label_by_id',
            description: 'Get a label by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                label_id: { type: 'string', description: 'The label ID' }
              },
              required: ['label_id']
            }
          },
          {
            name: 'void_label',
            description: 'Void a shipping label',
            inputSchema: {
              type: 'object',
              properties: {
                label_id: { type: 'string', description: 'The label ID to void' }
              },
              required: ['label_id']
            }
          },
          {
            name: 'track_package',
            description: 'Track a package using label ID',
            inputSchema: {
              type: 'object',
              properties: {
                label_id: { type: 'string', description: 'The label ID to track' }
              },
              required: ['label_id']
            }
          },
          // Rate tools
          {
            name: 'calculate_rates',
            description: 'Calculate shipping rates for a shipment',
            inputSchema: {
              type: 'object',
              properties: {
                rate_options: {
                  type: 'object',
                  properties: {
                    carrier_ids: { type: 'array', items: { type: 'string' }, description: 'Array of carrier IDs to get rates from' }
                  }
                },
                shipment: {
                  type: 'object',
                  required: ['ship_to', 'ship_from', 'packages'],
                  properties: {
                    ship_to: {
                      type: 'object',
                      required: ['name', 'address_line1', 'city_locality', 'state_province', 'postal_code', 'country_code'],
                      properties: {
                        name: { type: 'string' },
                        address_line1: { type: 'string' },
                        address_line2: { type: 'string' },
                        city_locality: { type: 'string' },
                        state_province: { type: 'string' },
                        postal_code: { type: 'string' },
                        country_code: { type: 'string' }
                      }
                    },
                    ship_from: {
                      type: 'object',
                      required: ['name', 'address_line1', 'city_locality', 'state_province', 'postal_code', 'country_code'],
                      properties: {
                        name: { type: 'string' },
                        address_line1: { type: 'string' },
                        address_line2: { type: 'string' },
                        city_locality: { type: 'string' },
                        state_province: { type: 'string' },
                        postal_code: { type: 'string' },
                        country_code: { type: 'string' }
                      }
                    },
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          weight: {
                            type: 'object',
                            properties: {
                              value: { type: 'number' },
                              unit: { type: 'string' }
                            }
                          },
                          dimensions: {
                            type: 'object',
                            properties: {
                              unit: { type: 'string' },
                              length: { type: 'number' },
                              width: { type: 'number' },
                              height: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ['shipment']
            }
          },
          // Carrier tools
          {
            name: 'get_carriers',
            description: 'List available carriers',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number for pagination' },
                page_size: { type: 'number', description: 'Number of items per page' }
              }
            }
          },
          {
            name: 'get_carrier_services',
            description: 'Get services for a specific carrier',
            inputSchema: {
              type: 'object',
              properties: {
                carrier_id: { type: 'string', description: 'The carrier ID' }
              },
              required: ['carrier_id']
            }
          },
          // Warehouse tools
          {
            name: 'get_warehouses',
            description: 'List warehouses',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number for pagination' },
                page_size: { type: 'number', description: 'Number of items per page' }
              }
            }
          },
          // Inventory tools
          {
            name: 'get_inventory',
            description: 'Get inventory levels',
            inputSchema: {
              type: 'object',
              properties: {
                sku: { type: 'string', description: 'Filter by SKU' },
                inventory_warehouse_id: { type: 'string', description: 'Filter by inventory warehouse ID' },
                inventory_location_id: { type: 'string', description: 'Filter by inventory location ID' },
                group_by: { type: 'string', description: 'Group by warehouse or location', enum: ['warehouse', 'location'] },
                limit: { type: 'number', description: 'Number of items to return' }
              }
            }
          },
          {
            name: 'update_inventory',
            description: 'Update SKU stock levels',
            inputSchema: {
              type: 'object',
              properties: {
                transaction_type: { 
                  type: 'string', 
                  description: 'Type of update (increment, decrement, adjust, modify)',
                  enum: ['increment', 'decrement', 'adjust', 'modify']
                },
                sku: { type: 'string', description: 'SKU to update' },
                quantity: { type: 'number', description: 'Quantity to update' },
                inventory_location_id: { type: 'string', description: 'Inventory location ID' },
                cost: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    currency: { type: 'string' }
                  },
                  description: 'Cost information'
                },
                condition: {
                  type: 'string',
                  enum: ['sellable', 'damaged', 'expired', 'qa_hold'],
                  description: 'Inventory condition'
                },
                reason: { type: 'string', description: 'Reason for update' },
                notes: { type: 'string', description: 'Additional notes' }
              },
              required: ['transaction_type', 'sku', 'quantity', 'inventory_location_id']
            }
          },
          {
            name: 'get_inventory_warehouses',
            description: 'Get inventory warehouses',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Number of items to return' }
              }
            }
          },
          {
            name: 'create_inventory_warehouse',
            description: 'Create a new inventory warehouse',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Warehouse name' }
              },
              required: ['name']
            }
          },
          {
            name: 'get_inventory_locations',
            description: 'Get inventory locations',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Number of items to return' }
              }
            }
          },
          {
            name: 'create_inventory_location',
            description: 'Create a new inventory location',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Location name' },
                inventory_warehouse_id: { type: 'string', description: 'Warehouse ID' }
              },
              required: ['name', 'inventory_warehouse_id']
            }
          },
          // Batch tools
          {
            name: 'get_batches',
            description: 'List batches with optional filtering parameters',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number for pagination' },
                page_size: { type: 'number', description: 'Number of items per page' },
                batch_number: { type: 'string', description: 'Filter by batch number' },
                external_batch_id: { type: 'string', description: 'Filter by external batch ID' },
                batch_status: { type: 'string', description: 'Filter by batch status' }
              }
            }
          },
          {
            name: 'create_batch',
            description: 'Create a new batch for bulk label processing',
            inputSchema: {
              type: 'object',
              properties: {
                batch_number: { type: 'string', description: 'Batch number' },
                external_batch_id: { type: 'string', description: 'External batch ID' },
                batch_notes: { type: 'string', description: 'Notes for the batch' }
              }
            }
          },
          {
            name: 'get_batch_by_id',
            description: 'Get a batch by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID' }
              },
              required: ['batch_id']
            }
          },
          {
            name: 'get_batch_by_external_id',
            description: 'Get a batch by its external ID',
            inputSchema: {
              type: 'object',
              properties: {
                external_batch_id: { type: 'string', description: 'The external batch ID' }
              },
              required: ['external_batch_id']
            }
          },
          {
            name: 'update_batch',
            description: 'Update batch information',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID' },
                batch_data: {
                  type: 'object',
                  properties: {
                    batch_number: { type: 'string', description: 'Batch number' },
                    external_batch_id: { type: 'string', description: 'External batch ID' },
                    batch_notes: { type: 'string', description: 'Notes for the batch' }
                  }
                }
              },
              required: ['batch_id', 'batch_data']
            }
          },
          {
            name: 'delete_batch',
            description: 'Delete a batch',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID to delete' }
              },
              required: ['batch_id']
            }
          },
          {
            name: 'add_to_batch',
            description: 'Add shipments to an existing batch',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID' },
                shipment_ids: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Array of shipment IDs to add to the batch'
                },
                rate_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of rate IDs to add to the batch'
                }
              },
              required: ['batch_id']
            }
          },
          {
            name: 'remove_from_batch',
            description: 'Remove items from a batch',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID' },
                shipment_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of shipment IDs to remove from the batch'
                },
                rate_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of rate IDs to remove from the batch'
                }
              },
              required: ['batch_id']
            }
          },
          {
            name: 'get_batch_errors',
            description: 'Get validation errors for a batch',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID' }
              },
              required: ['batch_id']
            }
          },
          {
            name: 'process_batch',
            description: 'Process a batch to create labels for all items',
            inputSchema: {
              type: 'object',
              properties: {
                batch_id: { type: 'string', description: 'The batch ID' },
                label_format: { type: 'string', description: 'Label format', enum: ['pdf', 'png', 'zpl'] },
                label_layout: { type: 'string', description: 'Label layout' }
              },
              required: ['batch_id']
            }
          },
          // Manifest tools
          {
            name: 'get_manifests',
            description: 'List manifests with optional filtering parameters',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number for pagination' },
                page_size: { type: 'number', description: 'Number of items per page' },
                carrier_id: { type: 'string', description: 'Filter by carrier ID' },
                warehouse_id: { type: 'string', description: 'Filter by warehouse ID' },
                ship_date_start: { type: 'string', description: 'Filter by ship date start (YYYY-MM-DD)' },
                ship_date_end: { type: 'string', description: 'Filter by ship date end (YYYY-MM-DD)' },
                created_at_start: { type: 'string', description: 'Filter by creation date start (YYYY-MM-DD)' },
                created_at_end: { type: 'string', description: 'Filter by creation date end (YYYY-MM-DD)' }
              }
            }
          },
          {
            name: 'create_manifest',
            description: 'Create a new manifest for end-of-day processing',
            inputSchema: {
              type: 'object',
              properties: {
                carrier_id: { type: 'string', description: 'Carrier ID for the manifest' },
                warehouse_id: { type: 'string', description: 'Warehouse ID for the manifest' },
                ship_date: { type: 'string', description: 'Ship date for the manifest (YYYY-MM-DD)' },
                label_ids: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Array of label IDs to include in the manifest'
                },
                excluded_label_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of label IDs to exclude from the manifest'
                }
              },
              required: ['carrier_id']
            }
          },
          {
            name: 'get_manifest_by_id',
            description: 'Get a manifest by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                manifest_id: { type: 'string', description: 'The manifest ID' }
              },
              required: ['manifest_id']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'get_shipments':
            result = await shipstation.getShipments(args || {});
            break;
          
          case 'create_shipment':
            // Structure the shipment creation request properly for the API
            const shipmentRequest = {
              shipments: [args.shipment]
            };
            result = await shipstation.createShipment(shipmentRequest);
            break;
          
          case 'get_shipment_by_id':
            result = await shipstation.getShipmentById(args.shipment_id);
            break;
          
          case 'cancel_shipment':
            result = await shipstation.cancelShipment(args.shipment_id);
            break;
          
          case 'get_labels':
            result = await shipstation.getLabels(args || {});
            break;
          
          case 'create_label':
            result = await shipstation.createLabel(args);
            break;
          
          case 'get_label_by_id':
            result = await shipstation.getLabelById(args.label_id);
            break;
          
          case 'void_label':
            result = await shipstation.voidLabel(args.label_id);
            break;
          
          case 'track_package':
            result = await shipstation.trackLabel(args.label_id);
            break;
          
          case 'calculate_rates':
            // Structure the rate request properly for the API
            const rateRequest = {
              rate_options: args.rate_options || {},
              shipment: args.shipment
            };
            result = await shipstation.calculateRates(rateRequest);
            break;
          
          case 'get_carriers':
            result = await shipstation.getCarriers(args || {});
            break;
          
          case 'get_carrier_services':
            result = await shipstation.getCarrierServices(args.carrier_id);
            break;
          
          case 'get_warehouses':
            result = await shipstation.getWarehouses(args || {});
            break;
          
          case 'get_inventory':
            result = await shipstation.getInventoryLevels(args || {});
            break;
          
          case 'update_inventory':
            result = await shipstation.updateInventory(args);
            break;
          
          case 'get_inventory_warehouses':
            result = await shipstation.getInventoryWarehouses(args || {});
            break;
          
          case 'create_inventory_warehouse':
            result = await shipstation.createInventoryWarehouse(args);
            break;
          
          case 'get_inventory_locations':
            result = await shipstation.getInventoryLocations(args || {});
            break;
          
          case 'create_inventory_location':
            result = await shipstation.createInventoryLocation(args);
            break;
          
          // Batch operations
          case 'get_batches':
            result = await shipstation.getBatches(args || {});
            break;
          
          case 'create_batch':
            result = await shipstation.createBatch(args);
            break;
          
          case 'get_batch_by_id':
            result = await shipstation.getBatchById(args.batch_id);
            break;
          
          case 'get_batch_by_external_id':
            result = await shipstation.getBatchByExternalId(args.external_batch_id);
            break;
          
          case 'update_batch':
            result = await shipstation.updateBatch(args.batch_id, args.batch_data);
            break;
          
          case 'delete_batch':
            result = await shipstation.deleteBatch(args.batch_id);
            break;
          
          case 'add_to_batch':
            const addData = {};
            if (args.shipment_ids) addData.shipment_ids = args.shipment_ids;
            if (args.rate_ids) addData.rate_ids = args.rate_ids;
            result = await shipstation.addToBatch(args.batch_id, addData);
            break;
          
          case 'remove_from_batch':
            const removeData = {};
            if (args.shipment_ids) removeData.shipment_ids = args.shipment_ids;
            if (args.rate_ids) removeData.rate_ids = args.rate_ids;
            result = await shipstation.removeFromBatch(args.batch_id, removeData);
            break;
          
          case 'get_batch_errors':
            result = await shipstation.getBatchErrors(args.batch_id);
            break;
          
          case 'process_batch':
            const processData = {};
            if (args.label_format) processData.label_format = args.label_format;
            if (args.label_layout) processData.label_layout = args.label_layout;
            result = await shipstation.processBatch(args.batch_id, processData);
            break;
          
          // Manifest operations
          case 'get_manifests':
            result = await shipstation.getManifests(args || {});
            break;
          
          case 'create_manifest':
            result = await shipstation.createManifest(args);
            break;
          
          case 'get_manifest_by_id':
            result = await shipstation.getManifestById(args.manifest_id);
            break;
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ShipStation MCP server running on stdio');
  }
}

const server = new ShipStationMCPServer();
server.run().catch(console.error);