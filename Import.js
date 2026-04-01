/**
 * Import Model (Phiếu nhập hàng)
 */

const mongoose = require('mongoose');

// Schema cho từng mặt hàng trong phiếu nhập
const importItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng tối thiểu là 1'],
  },
  importPrice: {
    type: Number,
    required: true,
    min: [0, 'Giá nhập không được âm'],
  },
}, { _id: false });

const importSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Nhà cung cấp là bắt buộc'],
  },
  items: {
    type: [importItemSchema],
    validate: {
      validator: (v) => v.length > 0,
      message: 'Phiếu nhập phải có ít nhất 1 sản phẩm',
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  note: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

// Auto-generate code before saving
importSchema.pre('save', async function(next) {
  if (!this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `PN${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Import', importSchema);
