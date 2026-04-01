/**
 * Reports Routes - Báo cáo thống kê
 * GET /api/reports/dashboard  - Tổng quan dashboard
 * GET /api/reports/summary    - Tổng nhập/xuất theo tháng
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Import = require('../models/Import');
const Export = require('../models/Export');

// GET /api/reports/dashboard - Dữ liệu tổng quan
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalProducts,
      products,
      totalImports,
      totalExports,
      recentImports,
      recentExports,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }, 'quantity importPrice salePrice lowStockThreshold name'),
      Import.countDocuments({ status: 'completed' }),
      Export.countDocuments({ status: 'completed' }),
      Import.find({ status: 'completed' }).populate('supplier', 'name').sort({ createdAt: -1 }).limit(5),
      Export.find({ status: 'completed' }).populate('customer', 'name').sort({ createdAt: -1 }).limit(5),
    ]);

    // Tổng tồn kho (số lượng)
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

    // Giá trị tồn kho (tính theo giá nhập)
    const inventoryValue = products.reduce((sum, p) => sum + p.quantity * p.importPrice, 0);

    // Sản phẩm sắp hết hàng
    const lowStockProducts = products.filter(p => p.quantity < p.lowStockThreshold);

    // Tổng doanh thu từ xuất hàng
    const revenueResult = await Export.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Tổng chi phí nhập hàng
    const importCostResult = await Import.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalImportCost = importCostResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalQuantity,
        inventoryValue,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({ _id: p._id, name: p.name, quantity: p.quantity })),
        totalImports,
        totalExports,
        totalRevenue,
        totalImportCost,
        recentImports,
        recentExports,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/monthly - Thống kê theo tháng (cho biểu đồ)
router.get('/monthly', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [importsByMonth, exportsByMonth] = await Promise.all([
      Import.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Export.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Format dữ liệu cho chart
    const monthLabels = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `T${d.getMonth() + 1}/${d.getFullYear()}` });
    }

    const chartData = monthLabels.map(({ year, month, label }) => {
      const imp = importsByMonth.find(m => m._id.year === year && m._id.month === month);
      const exp = exportsByMonth.find(m => m._id.year === year && m._id.month === month);
      return {
        month: label,
        nhapHang: imp?.totalAmount || 0,
        xuatHang: exp?.totalAmount || 0,
        soPhieuNhap: imp?.count || 0,
        soPhieuXuat: exp?.count || 0,
      };
    });

    res.json({ success: true, data: chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
