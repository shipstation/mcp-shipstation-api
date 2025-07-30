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
                  description: 'Shipment data for the label'
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