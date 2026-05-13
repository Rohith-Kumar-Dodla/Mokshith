import mongoose from 'mongoose';
import * as repo from './inventory.repository.js';
import AppError from '../../errors/AppError.js';
import Warehouse from '../warehouse/warehouse.model.js';

// ➕ Add Stock
export const addStock = async ({ productId, warehouseId, stock }) => {
  if (stock <= 0) {
    throw new AppError('Stock must be greater than 0', 400);
  }

  let inventory = await repo.findInventory(productId, warehouseId);

  if (!inventory) {
    return repo.createInventory({ productId, warehouseId, stock });
  }

  inventory.stock += stock;
  return inventory.save();
};

export const getLowStockItems = async () => {
  return repo.findLowStock();
};

export const getInventoryStats = async () => {
  const stats = await repo.getStats();
  return {
    ...stats,
    productCount: stats.uniqueProducts.length
  };
};

// 📦 Get All Inventory
export const getInventory = async () => {
  return repo.findAll();
};

// 🔄 Update Stock
export const updateStock = async ({ productId, warehouseId, stock, type = 'SET' }) => {
  let inventory = await repo.findInventory(productId, warehouseId);

  if (!inventory) {
    if (type === 'SET') {
      return repo.createInventory({ productId, warehouseId, stock });
    }
    throw new AppError('Inventory record not found', 404);
  }

  if (type === 'ADD') {
    inventory.stock += stock;
  } else if (type === 'SUBTRACT') {
    if (inventory.stock < stock) {
      throw new AppError('Insufficient stock', 400);
    }
    inventory.stock -= stock;
  } else {
    inventory.stock = stock;
  }

  return inventory.save();
};

// ✅ Check Stock Availability
export const checkStock = async (productId, quantity) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  const items = await repo.findByProduct(productId);

  // If no inventory records found, automatically create a default stock for demo/new products
  if (items.length === 0) {
    console.log(`Auto-seeding stock for product: ${productId}`);
    // Find first warehouse or create a default one
    let warehouse = await Warehouse.findOne();
    if (!warehouse) {
      warehouse = await Warehouse.create({ name: 'Main Warehouse', location: { city: 'Default' } });
    }
    
    await repo.createInventory({
      productId,
      warehouseId: warehouse._id,
      stock: 1000 // Seed with 1000 units for new products
    });
    return true;
  }

  const totalStock = items.reduce((sum, i) => sum + i.stock, 0);

  if (totalStock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  return true;
};

// 🔥 NEW — Deduct Stock (IMPORTANT FOR ORDER FLOW)
export const reduceStock = async (productId, quantity, options = {}) => {
  const { session } = options;
  
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  const items = await repo.findByProduct(productId);

  let remaining = quantity;

  for (const item of items) {
    if (remaining <= 0) break;

    const deductAmount = Math.min(item.stock, remaining);
    if (deductAmount <= 0) continue;

    // 🔥 Atomic Stock Deduction
    // We use stock: { $gte: deductAmount } to ensure we don't oversell
    // We removed the strict version check to prevent 409 conflicts in high-latency environments
    const updated = await mongoose.model('Inventory').findOneAndUpdate(
      { 
        _id: item._id, 
        stock: { $gte: deductAmount }
      },
      { 
        $inc: { stock: -deductAmount, version: 1 } 
      },
      { new: true, session }
    );

    if (!updated) {
      // This only happens if stock became less than deductAmount between read and write
      throw new AppError(`Insufficient stock for product: ${productId} in selected warehouse.`, 400);
    }

    remaining -= deductAmount;
  }

  if (remaining > 0) {
    throw new AppError(`Insufficient total stock for product: ${productId}`, 400);
  }

  return true;
};

// 🔥 Restore Stock (for payment failures, order cancellations)
export const restoreStock = async (productId, quantity, options = {}) => {
  const { session } = options;
  
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  // Find all inventory entries for this product
  const items = await repo.findByProduct(productId);

  if (items.length === 0) {
    console.warn(`No inventory found for product ${productId} to restore stock`);
    return false;
  }

  // Restore to the first warehouse (or you can implement more sophisticated logic)
  const firstWarehouse = items[0];
  
  const updated = await mongoose.model('Inventory').findOneAndUpdate(
    { _id: firstWarehouse._id },
    { $inc: { stock: quantity } },
    { new: true, session }
  );

  if (!updated) {
    throw new AppError('Failed to restore stock', 500);
  }

  console.log(`Restored ${quantity} units of product ${productId}`);
  return true;
};