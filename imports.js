/**
 * Imports Routes - Quản lý phiếu nhập hàng
 * GET    /api/imports       - Danh sách phiếu nhập
 * GET    /api/imports/:id   - Chi tiết phiếu nhập
 * POST   /api/imports       - Tạo phiếu nhập mới (tự động tăng tồn kho)
 * DELETE /api/imports/:id   - Hủy phiếu nhập (rollback tồn kho)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Import = require('../models/Import');
const Product = require('../models/Product');

// GET /api/imports
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.code = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [imports, total] = await Promise.all([
      Import.find(query)
        .populate('supplier', 'name phone')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Import.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: imports,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/imports/:id
router.get('/:id', async (req, res) => {
  try {
    const importDoc = await Import.findById(req.params.id)
      .populate('supplier', 'name phone address')
      .populate('items.product', 'name sku importPrice');
    if (!importDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    res.json({ success: true, data: importDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/imports - Tạo phiếu nhập và CẬP NHẬT tồn kho
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { supplier, items, note } = req.body;

    // Tính tổng tiền
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.importPrice, 0);

    // Tạo phiếu nhập
    const importDoc = new Import({ supplier, items, totalAmount, note });
    await importDoc.save({ session });

    // Cập nhật số lượng tồn kho cho từng sản phẩm
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } }, // Tăng số lượng
        { session }
      );
    }

    await session.commitTransaction();

    // Populate để trả về dữ liệu đầy đủ
    const populated = await Import.findById(importDoc._id)
      .populate('supplier', 'name phone')
      .populate('items.product', 'name sku');

    res.status(201).json({
      success: true,
      data: populated,
      message: `Tạo phiếu nhập ${importDoc.code} thành công`,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// DELETE /api/imports/:id - Hủy phiếu nhập (rollback tồn kho)
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const importDoc = await Import.findById(req.params.id).session(session);
    if (!importDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    if (importDoc.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Phiếu nhập đã bị hủy' });
    }

    // Rollback: Trừ lại số lượng tồn kho
    for (const item of importDoc.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { session }
      );
    }

    importDoc.status = 'cancelled';
    await importDoc.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: 'Hủy phiếu nhập thành công' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
