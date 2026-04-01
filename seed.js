/**
 * Seed script - Tạo dữ liệu mẫu ban đầu
 * Run: node config/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');

const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Import = require('../models/Import');
const Export = require('../models/Export');

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Product.deleteMany({}),
    Supplier.deleteMany({}),
    Customer.deleteMany({}),
    Import.deleteMany({}),
    Export.deleteMany({}),
  ]);
  console.log('🗑️  Đã xóa dữ liệu cũ');

  // Seed Suppliers (Nhà cung cấp)
  const suppliers = await Supplier.insertMany([
    { name: 'Công ty TNHH Điện Tử Minh Châu', phone: '0901234567', address: '123 Nguyễn Huệ, Q1, TP.HCM', email: 'contact@minhchau.vn', note: 'Nhà cung cấp linh kiện điện tử' },
    { name: 'Cty CP Phân Phối Thiết Bị Số', phone: '0912345678', address: '456 Lê Lợi, Q3, TP.HCM', email: 'sales@thietbiso.com', note: 'Chuyên laptop và máy tính bảng' },
    { name: 'Nhà Phân Phối Viễn Thông Nam Bộ', phone: '0923456789', address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM', email: 'info@nambo.vn' },
  ]);
  console.log('✅ Đã tạo nhà cung cấp');

  // Seed Customers (Khách hàng)
  const customers = await Customer.insertMany([
    { name: 'Nguyễn Văn An', phone: '0934567890', address: '12 Trần Hưng Đạo, Q5, TP.HCM', email: 'an.nguyen@gmail.com' },
    { name: 'Trần Thị Bích', phone: '0945678901', address: '34 Lý Thường Kiệt, Q10, TP.HCM', email: 'bich.tran@yahoo.com' },
    { name: 'Lê Minh Tuấn', phone: '0956789012', address: '56 Cách Mạng Tháng 8, Q Tân Bình, TP.HCM', email: 'tuan.le@outlook.com' },
    { name: 'Phạm Hoàng Linh', phone: '0967890123', address: '78 Nguyễn Oanh, Gò Vấp, TP.HCM' },
    { name: 'Võ Thị Mai', phone: '0978901234', address: '90 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM', email: 'mai.vo@gmail.com' },
  ]);
  console.log('✅ Đã tạo khách hàng');

  // Seed Products (Sản phẩm)
  const products = await Product.insertMany([
    { name: 'iPhone 15 Pro Max 256GB', sku: 'IP15PM-256', category: 'Điện thoại', importPrice: 25000000, salePrice: 32000000, quantity: 15 },
    { name: 'Samsung Galaxy S24 Ultra', sku: 'SS-S24U', category: 'Điện thoại', importPrice: 22000000, salePrice: 28000000, quantity: 8 },
    { name: 'MacBook Pro M3 14"', sku: 'MBP-M3-14', category: 'Laptop', importPrice: 42000000, salePrice: 52000000, quantity: 5 },
    { name: 'Dell XPS 15 i7', sku: 'DELL-XPS15', category: 'Laptop', importPrice: 28000000, salePrice: 36000000, quantity: 7 },
    { name: 'iPad Pro M2 11"', sku: 'IPAD-PRO-11', category: 'Máy tính bảng', importPrice: 18000000, salePrice: 23000000, quantity: 12 },
    { name: 'AirPods Pro 2nd Gen', sku: 'APP-2ND', category: 'Phụ kiện', importPrice: 4500000, salePrice: 6200000, quantity: 30 },
    { name: 'Samsung 65" QLED 4K', sku: 'SS-TV65-QLED', category: 'TV & Màn hình', importPrice: 22000000, salePrice: 30000000, quantity: 4 },
    { name: 'Bàn phím cơ Keychron K8', sku: 'KC-K8', category: 'Phụ kiện', importPrice: 1800000, salePrice: 2500000, quantity: 20 },
    { name: 'Chuột Logitech MX Master 3', sku: 'LG-MXM3', category: 'Phụ kiện', importPrice: 1200000, salePrice: 1800000, quantity: 25 },
    { name: 'Màn hình LG UltraWide 34"', sku: 'LG-UW34', category: 'TV & Màn hình', importPrice: 8500000, salePrice: 11000000, quantity: 6 },
    { name: 'Ổ cứng SSD Samsung 1TB', sku: 'SS-SSD-1TB', category: 'Linh kiện', importPrice: 1500000, salePrice: 2100000, quantity: 40 },
    { name: 'RAM Kingston 16GB DDR5', sku: 'KG-RAM-16GB', category: 'Linh kiện', importPrice: 900000, salePrice: 1300000, quantity: 3 },
  ]);
  console.log('✅ Đã tạo sản phẩm');

  // Seed Import receipts (Phiếu nhập)
  const importDate1 = new Date();
  importDate1.setDate(importDate1.getDate() - 30);
  
  const importReceipt1 = await Import.create({
    code: 'PN001',
    supplier: suppliers[0]._id,
    items: [
      { product: products[0]._id, quantity: 10, importPrice: 25000000 },
      { product: products[5]._id, quantity: 20, importPrice: 4500000 },
    ],
    totalAmount: 10 * 25000000 + 20 * 4500000,
    note: 'Nhập hàng tháng 3',
    createdAt: importDate1,
  });

  const importDate2 = new Date();
  importDate2.setDate(importDate2.getDate() - 15);

  const importReceipt2 = await Import.create({
    code: 'PN002',
    supplier: suppliers[1]._id,
    items: [
      { product: products[2]._id, quantity: 5, importPrice: 42000000 },
      { product: products[3]._id, quantity: 5, importPrice: 28000000 },
    ],
    totalAmount: 5 * 42000000 + 5 * 28000000,
    note: 'Nhập laptop tháng 3',
    createdAt: importDate2,
  });
  console.log('✅ Đã tạo phiếu nhập');

  // Seed Export receipts (Phiếu xuất)
  const exportDate1 = new Date();
  exportDate1.setDate(exportDate1.getDate() - 20);

  await Export.create({
    code: 'PX001',
    customer: customers[0]._id,
    items: [
      { product: products[0]._id, quantity: 2, salePrice: 32000000 },
      { product: products[5]._id, quantity: 2, salePrice: 6200000 },
    ],
    totalAmount: 2 * 32000000 + 2 * 6200000,
    note: 'Xuất hàng cho Nguyễn Văn An',
    createdAt: exportDate1,
  });

  const exportDate2 = new Date();
  exportDate2.setDate(exportDate2.getDate() - 10);

  await Export.create({
    code: 'PX002',
    customer: customers[1]._id,
    items: [
      { product: products[3]._id, quantity: 1, salePrice: 36000000 },
      { product: products[8]._id, quantity: 2, salePrice: 1800000 },
    ],
    totalAmount: 1 * 36000000 + 2 * 1800000,
    note: 'Xuất hàng cho Trần Thị Bích',
    createdAt: exportDate2,
  });
  console.log('✅ Đã tạo phiếu xuất');

  console.log('\n🎉 Seed data thành công!');
  console.log(`   - ${suppliers.length} nhà cung cấp`);
  console.log(`   - ${customers.length} khách hàng`);
  console.log(`   - ${products.length} sản phẩm`);
  console.log('   - 2 phiếu nhập');
  console.log('   - 2 phiếu xuất');

  process.exit(0);
};

seedData().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
