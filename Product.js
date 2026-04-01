/**
 * Product Model (Sản phẩm)
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true,
  },
  sku: {
    type: String,
    required: [true, 'SKU là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  category: {
    type: String,
    required: [true, 'Danh mục là bắt buộc'],
    trim: true,
  },
  importPrice: {
    type: Number,
    required: [true, 'Giá nhập là bắt buộc'],
    min: [0, 'Giá nhập không được âm'],
  },
  salePrice: {
    type: Number,
    required: [true, 'Giá bán là bắt buộc'],
    min: [0, 'Giá bán không được âm'],
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng không được âm'],
  },
  // Cảnh báo khi quantity < lowStockThreshold
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

// Virtual: Kiểm tra sản phẩm sắp hết hàng
productSchema.virtual('isLowStock').get(function() {
  return this.quantity < this.lowStockThreshold;
});

// Virtual: Lợi nhuận
productSchema.virtual('profit').get(function() {
  return this.salePrice - this.importPrice;
});

// Index để tìm kiếm nhanh
productSchema.index({ name: 'text', sku: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
