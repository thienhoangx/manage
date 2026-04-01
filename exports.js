/**
 * Exports Routes - Quản lý phiếu xuất hàng
 * GET    /api/exports       - Danh sách phiếu xuất
 * GET    /api/exports/:id   - Chi tiết phiếu xuất
 * POST   /api/exports       - Tạo phiếu xuất (kiểm tra & trừ tồn kho)
 * DELETE /api/exports/:id   - Hủy phiếu xuất (rollback tồn kho)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Export = require('../models/Export');
const Product = require('../models/Product');

// GET /api/exports
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.code = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [exports, total] = await Promise.all([
      Export.find(query)
        .populate('customer', 'name phone')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Export.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: exports,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/exports/:id
router.get('/:id', async (req, res) => {
  try {
    const exportDoc = await Export.findById(req.params.id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name sku salePrice');
    if (!exportDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu xuất' });
    res.json({ success: true, data: exportDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/exports - Tạo phiếu xuất và TRỪ tồn kho
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer, items, note } = req.body;

    // KIỂM TRA tồn kho trước khi xuất
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm ID: ${item.product}`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(
          `Sản phẩm "${product.name}" không đủ tồn kho. Hiện có: ${product.quantity}, Cần xuất: ${item.quantity}`
        );
      }
    }

    // Tính tổng tiền
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.salePrice, 0);

    // Tạo phiếu xuất
    const exportDoc = new Export({ customer, items, totalAmount, note });
    await exportDoc.save({ session });

    // Trừ số lượng tồn kho
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } }, // Trừ số lượng
        { session }
      );
    }

    await session.commitTransaction();

    // Populate để trả về dữ liệu đầy đủ
    const populated = await Export.findById(exportDoc._id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku');

    res.status(201).json({
      success: true,
      data: populated,
      message: `Tạo phiếu xuất ${exportDoc.code} thành công`,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// DELETE /api/exports/:id - Hủy phiếu xuất (rollback tồn kho)
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const exportDoc = await Export.findById(req.params.id).session(session);
    if (!exportDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu xuất' });
    if (exportDoc.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Phiếu xuất đã bị hủy' });
    }

    // Rollback: Hoàn lại số lượng tồn kho
    for (const item of exportDoc.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }

    exportDoc.status = 'cancelled';
    await exportDoc.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: 'Hủy phiếu xuất thành công' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
