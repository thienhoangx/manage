/**
 * Export Model (Phiếu xuất hàng)
 */

const mongoose = require('mongoose');

// Schema cho từng mặt hàng trong phiếu xuất
const exportItemSchema = new mongoose.Schema({
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
  salePrice: {
    type: Number,
    required: true,
    min: [0, 'Giá bán không được âm'],
  },
}, { _id: false });

const exportSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Khách hàng là bắt buộc'],
  },
  items: {
    type: [exportItemSchema],
    validate: {
      validator: (v) => v.length > 0,
      message: 'Phiếu xuất phải có ít nhất 1 sản phẩm',
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
exportSchema.pre('save', async function(next) {
  if (!this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `PX${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Export', exportSchema);
