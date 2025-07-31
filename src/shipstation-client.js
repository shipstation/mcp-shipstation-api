import axios from 'axios';

class ShipStationClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.shipstation.com';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          console.error('ShipStation API Error Details:', {
            status,
            data,
            url: error.config?.url,
            method: error.config?.method,
            requestData: error.config?.data
          });
          throw new Error(`ShipStation API Error ${status}: ${JSON.stringify(data)}`);
        }
        throw error;
      }
    );
  }

  // Shipments
  async getShipments(params = {}) {
    const response = await this.client.get('/v2/shipments', { params });
    return response.data;
  }

  async createShipment(shipmentData) {
    const response = await this.client.post('/v2/shipments', shipmentData);
    return response.data;
  }

  async updateShipment(shipmentId, shipmentData) {
    const response = await this.client.put(`/v2/shipments/${shipmentId}`, shipmentData);
    return response.data;
  }

  async getShipmentById(shipmentId) {
    const response = await this.client.get(`/v2/shipments/${shipmentId}`);
    return response.data;
  }

  async getShipmentByExternalId(externalId) {
    const response = await this.client.get(`/v2/shipments/external_shipment_id/${externalId}`);
    return response.data;
  }

  async cancelShipment(shipmentId) {
    const response = await this.client.post(`/v2/shipments/${shipmentId}/cancel`);
    return response.data;
  }

  async getShipmentRates(shipmentId) {
    const response = await this.client.get(`/v2/shipments/${shipmentId}/rates`);
    return response.data;
  }

  // Labels
  async getLabels(params = {}) {
    const response = await this.client.get('/v2/labels', { params });
    return response.data;
  }

  async createLabel(labelData) {
    const response = await this.client.post('/v2/labels', labelData);
    return response.data;
  }

  async createLabelFromRate(rateId, labelData = {}) {
    const response = await this.client.post(`/v2/labels/rates/${rateId}`, labelData);
    return response.data;
  }

  async createLabelFromShipment(shipmentId, labelData = {}) {
    const response = await this.client.post(`/v2/labels/shipment/${shipmentId}`, labelData);
    return response.data;
  }

  async getLabelById(labelId) {
    const response = await this.client.get(`/v2/labels/${labelId}`);
    return response.data;
  }

  async voidLabel(labelId) {
    const response = await this.client.post(`/v2/labels/${labelId}/void`);
    return response.data;
  }

  async trackLabel(labelId) {
    const response = await this.client.get(`/v2/labels/${labelId}/track`);
    return response.data;
  }

  // Rates
  async calculateRates(rateData) {
    const response = await this.client.post('/v2/rates', rateData);
    return response.data;
  }

  async estimateRates(estimateData) {
    const response = await this.client.post('/v2/rates/estimate', estimateData);
    return response.data;
  }

  async getRateById(rateId) {
    const response = await this.client.get(`/v2/rates/${rateId}`);
    return response.data;
  }

  // Carriers
  async getCarriers(params = {}) {
    const response = await this.client.get('/v2/carriers', { params });
    return response.data;
  }

  async getCarrierById(carrierId) {
    const response = await this.client.get(`/v2/carriers/${carrierId}`);
    return response.data;
  }

  async getCarrierServices(carrierId) {
    const response = await this.client.get(`/v2/carriers/${carrierId}/services`);
    return response.data;
  }

  async getCarrierPackageTypes(carrierId) {
    const response = await this.client.get(`/v2/carriers/${carrierId}/packages`);
    return response.data;
  }

  // Inventory
  async getInventoryLevels(params = {}) {
    const response = await this.client.get('/v2/inventory', { params });
    return response.data;
  }

  async updateInventory(inventoryData) {
    const response = await this.client.post('/v2/inventory', inventoryData);
    return response.data;
  }

  // Warehouses
  async getWarehouses(params = {}) {
    const response = await this.client.get('/v2/warehouses', { params });
    return response.data;
  }

  async getWarehouseById(warehouseId) {
    const response = await this.client.get(`/v2/warehouses/${warehouseId}`);
    return response.data;
  }

  // Inventory Warehouses
  async getInventoryWarehouses(params = {}) {
    const response = await this.client.get('/v2/inventory_warehouses', { params });
    return response.data;
  }

  async createInventoryWarehouse(warehouseData) {
    const response = await this.client.post('/v2/inventory_warehouses', warehouseData);
    return response.data;
  }

  async getInventoryWarehouseById(warehouseId) {
    const response = await this.client.get(`/v2/inventory_warehouses/${warehouseId}`);
    return response.data;
  }

  async updateInventoryWarehouse(warehouseId, warehouseData) {
    const response = await this.client.put(`/v2/inventory_warehouses/${warehouseId}`, warehouseData);
    return response.data;
  }

  async deleteInventoryWarehouse(warehouseId) {
    const response = await this.client.delete(`/v2/inventory_warehouses/${warehouseId}`);
    return response.data;
  }

  // Inventory Locations
  async getInventoryLocations(params = {}) {
    const response = await this.client.get('/v2/inventory_locations', { params });
    return response.data;
  }

  async createInventoryLocation(locationData) {
    const response = await this.client.post('/v2/inventory_locations', locationData);
    return response.data;
  }

  async getInventoryLocationById(locationId) {
    const response = await this.client.get(`/v2/inventory_locations/${locationId}`);
    return response.data;
  }

  async updateInventoryLocation(locationId, locationData) {
    const response = await this.client.put(`/v2/inventory_locations/${locationId}`, locationData);
    return response.data;
  }

  async deleteInventoryLocation(locationId) {
    const response = await this.client.delete(`/v2/inventory_locations/${locationId}`);
    return response.data;
  }

  // Batches
  async getBatches(params = {}) {
    const response = await this.client.get('/v2/batches', { params });
    return response.data;
  }

  async createBatch(batchData) {
    const response = await this.client.post('/v2/batches', batchData);
    return response.data;
  }

  async getBatchByExternalId(externalBatchId) {
    const response = await this.client.get(`/v2/batches/external_batch_id/${externalBatchId}`);
    return response.data;
  }

  async getBatchById(batchId) {
    const response = await this.client.get(`/v2/batches/${batchId}`);
    return response.data;
  }

  async updateBatch(batchId, batchData) {
    const response = await this.client.put(`/v2/batches/${batchId}`, batchData);
    return response.data;
  }

  async deleteBatch(batchId) {
    const response = await this.client.delete(`/v2/batches/${batchId}`);
    return response.data;
  }

  async addToBatch(batchId, itemData) {
    const response = await this.client.post(`/v2/batches/${batchId}/add`, itemData);
    return response.data;
  }

  async getBatchErrors(batchId) {
    const response = await this.client.get(`/v2/batches/${batchId}/errors`);
    return response.data;
  }

  async processBatch(batchId, processData = {}) {
    const response = await this.client.post(`/v2/batches/${batchId}/process/labels`, processData);
    return response.data;
  }

  async removeFromBatch(batchId, removeData) {
    const response = await this.client.post(`/v2/batches/${batchId}/remove`, removeData);
    return response.data;
  }

  // Carrier Options
  async getCarrierOptions(carrierId) {
    const response = await this.client.get(`/v2/carriers/${carrierId}/options`);
    return response.data;
  }

  // Manifests
  async getManifests(params = {}) {
    const response = await this.client.get('/v2/manifests', { params });
    return response.data;
  }

  async createManifest(manifestData) {
    const response = await this.client.post('/v2/manifests', manifestData);
    return response.data;
  }

  async getManifestById(manifestId) {
    const response = await this.client.get(`/v2/manifests/${manifestId}`);
    return response.data;
  }

  // Package Types
  async getPackageTypes(params = {}) {
    const response = await this.client.get('/v2/packages', { params });
    return response.data;
  }

  async createPackageType(packageData) {
    const response = await this.client.post('/v2/packages', packageData);
    return response.data;
  }

  async getPackageTypeById(packageId) {
    const response = await this.client.get(`/v2/packages/${packageId}`);
    return response.data;
  }

  async updatePackageType(packageId, packageData) {
    const response = await this.client.put(`/v2/packages/${packageId}`, packageData);
    return response.data;
  }

  async deletePackageType(packageId) {
    const response = await this.client.delete(`/v2/packages/${packageId}`);
    return response.data;
  }

  // Package Pickups
  async getPickups(params = {}) {
    const response = await this.client.get('/v2/pickups', { params });
    return response.data;
  }

  async schedulePickup(pickupData) {
    const response = await this.client.post('/v2/pickups', pickupData);
    return response.data;
  }

  async getPickupById(pickupId) {
    const response = await this.client.get(`/v2/pickups/${pickupId}`);
    return response.data;
  }

  async cancelPickup(pickupId) {
    const response = await this.client.delete(`/v2/pickups/${pickupId}`);
    return response.data;
  }

  // Return Labels
  async createReturnLabel(labelId, returnData = {}) {
    const response = await this.client.post(`/v2/labels/${labelId}/return`, returnData);
    return response.data;
  }

  // Shipment Tagging
  async tagShipment(shipmentId, tagName) {
    const response = await this.client.post(`/v2/shipments/${shipmentId}/tags/${tagName}`);
    return response.data;
  }

  async untagShipment(shipmentId, tagName) {
    const response = await this.client.delete(`/v2/shipments/${shipmentId}/tags/${tagName}`);
    return response.data;
  }

  // Tags
  async getTags(params = {}) {
    const response = await this.client.get('/v2/tags', { params });
    return response.data;
  }

  async createTag(tagData) {
    const response = await this.client.post('/v2/tags', tagData);
    return response.data;
  }

  async deleteTag(tagName) {
    const response = await this.client.delete(`/v2/tags/${tagName}`);
    return response.data;
  }

  // Tracking
  async stopTracking(trackingData) {
    const response = await this.client.post('/v2/tracking/stop', trackingData);
    return response.data;
  }

  // Webhooks
  async getWebhooks(params = {}) {
    const response = await this.client.get('/v2/environment/webhooks', { params });
    return response.data;
  }

  async createWebhook(webhookData) {
    const response = await this.client.post('/v2/environment/webhooks', webhookData);
    return response.data;
  }

  async getWebhookById(webhookId) {
    const response = await this.client.get(`/v2/environment/webhooks/${webhookId}`);
    return response.data;
  }

  async updateWebhook(webhookId, webhookData) {
    const response = await this.client.put(`/v2/environment/webhooks/${webhookId}`, webhookData);
    return response.data;
  }

  async deleteWebhook(webhookId) {
    const response = await this.client.delete(`/v2/environment/webhooks/${webhookId}`);
    return response.data;
  }

  // Users and Products
  async getUsers(params = {}) {
    const response = await this.client.get('/v2/users', { params });
    return response.data;
  }

  async getProducts(params = {}) {
    const response = await this.client.get('/v2/products', { params });
    return response.data;
  }

  // File Downloads
  async downloadFile(filePath, rotation = null) {
    const params = rotation ? { rotation } : {};
    const response = await this.client.get(`/v2/downloads/${filePath}`, {
      params,
      responseType: 'arraybuffer'
    });
    return response.data;
  }
}

export default ShipStationClient;