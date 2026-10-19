import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { requireAuth, optionalAuth, requireRole, signToken, recordAuditLog } from './auth';

export const apiRouter = express.Router();

// ==========================================
// 1. Authentication Endpoints
// ==========================================

/**
 * POST /api/auth/login
 * Real credentials verification with bcrypt and JWT
 */
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '請輸入電子郵件與密碼',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = db.prepare(`
    SELECT id, email, password_hash, name, department, role, status
    FROM users
    WHERE LOWER(email) = ?
  `).get(normalizedEmail) as any;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '帳號或密碼不正確，請確認後再試一次',
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: '此帳號已被停用，請聯絡系統管理者',
    });
  }

  const isPasswordValid = bcrypt.compareSync(String(password).trim(), user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: '帳號或密碼不正確，請確認後再試一次',
    });
  }

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
    role: user.role,
  };

  const token = signToken(authUser);

  // Set secure HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  recordAuditLog(req, 'USER_LOGIN', 'user', user.id, { email: user.email, name: user.name });

  return res.json({
    success: true,
    token,
    user: authUser,
    message: `歡迎回來，${user.name}！`,
  });
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, name, department } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: '請填寫姓名、電子郵件與密碼所有必填欄位',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedPassword = String(password).trim();
  const trimmedName = String(name).trim();

  if (trimmedPassword.length < 4) {
    return res.status(400).json({
      success: false,
      error: '密碼長度至少需要 4 碼',
    });
  }

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;
  if (existing) {
    return res.status(409).json({
      success: false,
      error: '該電子郵件已被註冊，請直接登入或使用其他信箱',
    });
  }

  const userId = `usr-${Date.now()}`;
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(trimmedPassword, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, department, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'user', 'active', ?, ?)
  `).run(
    userId,
    normalizedEmail,
    passwordHash,
    trimmedName,
    department ? String(department).trim() : '業務部',
    now,
    now
  );

  const newUser = {
    id: userId,
    email: normalizedEmail,
    name: trimmedName,
    department: department ? String(department).trim() : '業務部',
    role: 'user' as const,
  };

  const token = signToken(newUser);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  recordAuditLog(req, 'USER_REGISTER', 'user', userId, { email: normalizedEmail, name: trimmedName });

  return res.status(201).json({
    success: true,
    token,
    user: newUser,
    message: '帳號註冊成功，已自動登入！',
  });
});

/**
 * POST /api/auth/logout
 */
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: '已成功登出系統',
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/change-password
 */
apiRouter.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: '請輸入舊密碼與新密碼' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user || !bcrypt.compareSync(String(oldPassword).trim(), user.password_hash)) {
    return res.status(400).json({ success: false, error: '舊密碼驗證不符' });
  }

  const newHash = bcrypt.hashSync(String(newPassword).trim(), 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    newHash,
    new Date().toISOString(),
    req.user!.id
  );

  recordAuditLog(req, 'CHANGE_PASSWORD', 'user', req.user!.id, {});
  return res.json({ success: true, message: '密碼已成功變更！' });
});

// ==========================================
// 2. Categories & Products CRUD
// ==========================================

/**
 * GET /api/categories
 */
apiRouter.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as any[];
    const parsed = categories.map((c) => ({
      id: c.id,
      name: c.name,
      subCategories: JSON.parse(c.subcategories || '[]'),
    }));
    return res.json({ success: true, categories: parsed });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '讀取產品分類失敗：' + err.message });
  }
});

/**
 * GET /api/products
 * Read products with full nested SKU variants, optional search & category filter
 */
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const { category, subcategory, q } = req.query;

    let query = `
      SELECT p.*
      FROM products p
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ` AND p.category_id = ?`;
      params.push(String(category));
    }

    if (subcategory) {
      query += ` AND p.subcategory = ?`;
      params.push(String(subcategory));
    }

    if (q) {
      const searchPattern = `%${String(q).trim()}%`;
      query += ` AND (p.product_code LIKE ? OR p.product_name LIKE ? OR p.description LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY p.product_code ASC`;

    const products = db.prepare(query).all(...params) as any[];

    // Fetch all variants for these products
    const variants = db.prepare(`SELECT * FROM product_variants ORDER BY sku_code ASC`).all() as any[];

    // Group variants by product_id
    const variantsByProdId: Record<string, any[]> = {};
    for (const v of variants) {
      if (!variantsByProdId[v.product_id]) {
        variantsByProdId[v.product_id] = [];
      }
      variantsByProdId[v.product_id].push({
        id: v.id,
        code: v.sku_code,
        name: v.variant_name,
        colorHex: v.color_hex,
        totalStock: v.total_stock,
        reserved: v.reserved,
        safetyStock: v.safety_stock,
        locationBin: v.location_bin,
        barcode: v.barcode,
        unitPrice: v.unit_price,
        status: v.status,
        customImage: v.custom_image || undefined,
        warehouses: [
          { warehouseId: 'W1', name: '企劃樣品庫', onHand: Math.max(0, v.total_stock - v.reserved), reserved: v.reserved },
        ],
      });
    }

    const formattedProducts = products.map((p) => ({
      id: p.id,
      code: p.product_code,
      name: p.product_name,
      categoryId: p.category_id,
      categoryName: p.category_name,
      subCategory: p.subcategory || '',
      imOm: p.im_om,
      dimensions: p.size_dimensions,
      material: p.material,
      color: p.color,
      quantity: p.quantity,
      reservedQuantity: p.reserved_quantity,
      safetyStock: p.safety_stock,
      locationBin: p.location_bin,
      status: p.product_status,
      description: p.description,
      image: p.image_url,
      createdBy: p.created_by,
      updatedBy: p.updated_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      variants: variantsByProdId[p.id] || [],
    }));

    return res.json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '資料庫查詢失敗：' + err.message });
  }
});

/**
 * POST /api/products
 * Create product (Admin or Manager only)
 */
apiRouter.post('/products', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      subCategory,
      productCode,
      productName,
      material,
      dimensions,
      variantCode,
      variantName,
      initialStock,
    } = req.body;

    if (!categoryId || !productCode || !productName) {
      return res.status(400).json({
        success: false,
        error: '必填欄位不可為空：大分類、型號代碼與型號品名皆為必填',
      });
    }

    const formattedCode = String(productCode).trim().toUpperCase();
    const formattedName = String(productName).trim();
    const stockQty = Number(initialStock) || 0;

    // Validation: Unique Product Code
    const existing = db.prepare('SELECT id FROM products WHERE product_code = ?').get(formattedCode) as any;
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `型號代碼【${formattedCode}】在資料庫中已存在，請使用不同代碼避免衝突`,
      });
    }

    // Lookup Category Name
    const catRow = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId) as any;
    const catName = catRow ? catRow.name : 'No Tool';

    const productId = `prod-${formattedCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    // Generate SKU code
    let formattedVariantCode = String(variantCode || `${formattedCode}-001`).trim().toUpperCase();
    if (!formattedVariantCode.startsWith(`${formattedCode}-`)) {
      formattedVariantCode = `${formattedCode}-${formattedVariantCode.replace(/^[A-Za-z]+-/, '') || '001'}`;
    }

    // Atomic transaction for Product + Variant + Transaction log
    db.exec('BEGIN TRANSACTION;');

    try {
      db.prepare(`
        INSERT INTO products (
          id, product_code, product_name, category_id, category_name, subcategory,
          im_om, size_dimensions, material, color, quantity, reserved_quantity,
          safety_stock, location_bin, product_status, description, image_url,
          created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'OM', ?, ?, ?, ?, 0, 10, ?, 'optimal', '全新企劃展示樣品', '', ?, ?, ?, ?)
      `).run(
        productId,
        formattedCode,
        formattedName,
        categoryId,
        catName,
        subCategory ? String(subCategory).trim() : '',
        dimensions ? String(dimensions).trim() : 'W: 36" × H: 72"',
        material ? String(material).trim() : '鋁合金 / 阻燃遮光聚酯纖維',
        variantName ? String(variantName).trim() : 'Default Color',
        stockQty,
        `${formattedCode}-01`,
        req.user!.name,
        req.user!.name,
        now,
        now
      );

      // Insert Initial Variant
      const variantId = `var-${Date.now()}`;
      db.prepare(`
        INSERT INTO product_variants (
          id, product_id, product_code, sku_code, variant_name, color_hex,
          total_stock, reserved, safety_stock, location_bin, barcode,
          unit_price, status, custom_image, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, '#ffffff', ?, 0, 10, ?, ?, 1500, 'optimal', '', ?, ?)
      `).run(
        variantId,
        productId,
        formattedCode,
        formattedVariantCode,
        variantName ? String(variantName).trim() : 'Default Color',
        stockQty,
        `${formattedCode}-01`,
        `471000${Math.floor(10000 + Math.random() * 90000)}`,
        now,
        now
      );

      // Insert stock transaction
      if (stockQty > 0) {
        db.prepare(`
          INSERT INTO stock_transactions (
            id, product_id, sku_code, type, quantity, previous_stock, new_stock,
            reference_id, reason, operator_name, operator_id, created_at
          ) VALUES (?, ?, ?, 'IN', ?, 0, ?, 'PO-NEW', '新品建檔入庫', ?, ?, ?)
        `).run(
          `tx-${Date.now()}`,
          productId,
          formattedVariantCode,
          stockQty,
          stockQty,
          req.user!.name,
          req.user!.id,
          now
        );
      }

      // Insert New Notice (新品到庫通知)
      const noticeId = `not-${Date.now()}`;
      const subCatText = subCategory ? String(subCategory).trim() : '';
      const summaryText = `次分類：${subCatText || '通用'} ｜ 規格：${formattedVariantCode} (${variantName ? String(variantName).trim() : '標準規格'}) ｜ 初始入庫數量：${stockQty} 件 ｜ 儲位：${formattedCode}-01`;

      db.prepare(`
        INSERT INTO notices (
          id, category, title, summary, model_code, sku_code,
          target_category_id, category_name, quantity, date, is_read, tag_color, created_at
        ) VALUES (?, '新品到庫', ?, ?, ?, ?, ?, ?, ?, ?, 0, 'bg-[#e2f1e6] text-[#2c5f40]', ?)
      `).run(
        noticeId,
        `【${catName}】${formattedCode} ${formattedName} 新品已入庫`,
        summaryText,
        formattedCode,
        formattedVariantCode,
        categoryId,
        catName,
        stockQty,
        now.slice(0, 10),
        now
      );

      db.exec('COMMIT;');
    } catch (innerErr) {
      db.exec('ROLLBACK;');
      throw innerErr;
    }

    recordAuditLog(req, 'CREATE_PRODUCT', 'product', productId, {
      productCode: formattedCode,
      productName: formattedName,
      skuCode: formattedVariantCode,
      initialStock: stockQty,
    });

    return res.status(201).json({
      success: true,
      productId,
      productCode: formattedCode,
      message: `產品【${formattedCode} - ${formattedName}】已真正新增至資料庫！`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '新增產品失敗：' + err.message });
  }
});

/**
 * PUT /api/products/:id
 * Update product specifications (Admin or Manager only)
 */
apiRouter.put('/products/:id', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productName, material, dimensions, description, expectedUpdatedAt } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ? OR product_code = ?').get(id, id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: '找不到指定產品' });
    }

    // Concurrency Optimistic Locking Check
    if (expectedUpdatedAt && existing.updated_at !== expectedUpdatedAt) {
      return res.status(409).json({
        success: false,
        error: '該產品已被其他使用者修改過，請重新整理取得最新資料後再儲存',
        currentUpdatedAt: existing.updated_at,
      });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE products
      SET product_name = COALESCE(?, product_name),
          material = COALESCE(?, material),
          size_dimensions = COALESCE(?, size_dimensions),
          description = COALESCE(?, description),
          updated_by = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      productName ? String(productName).trim() : null,
      material ? String(material).trim() : null,
      dimensions ? String(dimensions).trim() : null,
      description !== undefined ? String(description) : null,
      req.user!.name,
      now,
      existing.id
    );

    recordAuditLog(req, 'UPDATE_PRODUCT', 'product', existing.id, {
      productCode: existing.product_code,
      before: { name: existing.product_name, material: existing.material },
      after: { productName, material, dimensions },
    });

    return res.json({ success: true, message: '產品規格已成功更新至資料庫', updatedAt: now });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '更新失敗：' + err.message });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product & variants (Admin and Manager)
 */
apiRouter.delete('/products/:id', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ? OR product_code = ?').get(id, id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: '找不到欲刪除的產品' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      // Cascade delete associated borrow records, variants, and product
      db.prepare('DELETE FROM borrow_records WHERE product_id = ? OR model_code = ?').run(existing.id, existing.product_code);
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(existing.id);
      db.prepare('DELETE FROM products WHERE id = ?').run(existing.id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    recordAuditLog(req, 'DELETE_PRODUCT', 'product', existing.id, {
      deletedProductCode: existing.product_code,
      deletedProductName: existing.product_name,
    });

    return res.json({
      success: true,
      message: `型號【${existing.product_code}】及其所有規格已自資料庫永久刪除`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '刪除失敗：' + err.message });
  }
});

// ==========================================
// 3. Variant SKU & Stock Adjustments
// ==========================================

/**
 * PUT /api/variants/:skuCode
 * Update variant stock, location bin, or photo (Admin or Manager)
 */
apiRouter.put('/variants/:skuCode', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { skuCode } = req.params;
    const { newTotalStock, locationBin, customImage, reason } = req.body;

    const variant = db.prepare('SELECT * FROM product_variants WHERE sku_code = ?').get(skuCode) as any;
    if (!variant) {
      return res.status(404).json({ success: false, error: '找不到指定規格 SKU' });
    }

    const now = new Date().toISOString();
    const prevStock = variant.total_stock;
    const nextStock = newTotalStock !== undefined ? Math.max(0, Number(newTotalStock)) : prevStock;
    const diff = nextStock - prevStock;

    let finalCustomImage = customImage !== undefined ? (customImage ? String(customImage).trim() : '') : null;
    if (finalCustomImage && finalCustomImage.startsWith('data:image/')) {
      try {
        const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const commaIdx = finalCustomImage.indexOf(',');
        const header = finalCustomImage.slice(0, commaIdx);
        const data = finalCustomImage.slice(commaIdx + 1);
        let ext = 'png';
        if (header.includes('jpeg') || header.includes('jpg')) ext = 'jpg';
        else if (header.includes('webp')) ext = 'webp';

        const filename = `${skuCode.toLowerCase()}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
        finalCustomImage = `/uploads/${filename}`;
      } catch (saveErr) {
        console.error('Failed to save image file:', saveErr);
      }
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        UPDATE product_variants
        SET total_stock = ?,
            location_bin = COALESCE(?, location_bin),
            custom_image = COALESCE(?, custom_image),
            status = CASE WHEN ? <= safety_stock THEN 'warning' ELSE 'optimal' END,
            updated_at = ?
        WHERE sku_code = ?
      `).run(
        nextStock,
        locationBin ? String(locationBin).trim() : null,
        finalCustomImage !== null ? finalCustomImage : null,
        nextStock,
        now,
        skuCode
      );

      // Re-sum total quantity for parent product
      const sumRow = db.prepare(`
        SELECT SUM(total_stock) as total_qty, SUM(reserved) as total_res
        FROM product_variants WHERE product_id = ?
      `).get(variant.product_id) as any;

      // Update parent product quantity and image_url if parent product currently has default image
      if (finalCustomImage) {
        db.prepare(`
          UPDATE products
          SET quantity = ?,
              reserved_quantity = ?,
              product_status = CASE WHEN ? <= safety_stock THEN 'warning' ELSE 'optimal' END,
              image_url = CASE
                WHEN image_url IS NULL OR image_url = '' OR image_url LIKE '%shade_no_tool%' THEN ?
                ELSE image_url
              END,
              updated_by = ?,
              updated_at = ?
          WHERE id = ?
        `).run(
          sumRow.total_qty || 0,
          sumRow.total_res || 0,
          sumRow.total_qty || 0,
          finalCustomImage,
          req.user!.name,
          now,
          variant.product_id
        );
      } else {
        db.prepare(`
          UPDATE products
          SET quantity = ?,
              reserved_quantity = ?,
              product_status = CASE WHEN ? <= safety_stock THEN 'warning' ELSE 'optimal' END,
              updated_by = ?,
              updated_at = ?
          WHERE id = ?
        `).run(
          sumRow.total_qty || 0,
          sumRow.total_res || 0,
          sumRow.total_qty || 0,
          req.user!.name,
          now,
          variant.product_id
        );
      }

      // Record transaction if stock changed
      if (diff !== 0) {
        db.prepare(`
          INSERT INTO stock_transactions (
            id, product_id, sku_code, type, quantity, previous_stock, new_stock,
            reference_id, reason, operator_name, operator_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ADJUST', ?, ?, ?, ?)
        `).run(
          `tx-${Date.now()}`,
          variant.product_id,
          skuCode,
          diff > 0 ? 'IN' : 'OUT',
          Math.abs(diff),
          prevStock,
          nextStock,
          reason ? String(reason).trim() : '人工盤點庫存校正',
          req.user!.name,
          req.user!.id,
          now
        );
      }

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    recordAuditLog(req, 'ADJUST_STOCK', 'variant', skuCode, {
      previousStock: prevStock,
      newStock: nextStock,
      reason: reason || '庫存盤點調整',
    });

    return res.json({
      success: true,
      message: `規格【${skuCode}】在庫庫存已更新為 ${nextStock} 件`,
      totalStock: nextStock,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '庫存調整失敗：' + err.message });
  }
});

/**
 * DELETE /api/variants/:skuCode
 * Delete variant SKU (Admin and Manager)
 */
apiRouter.delete('/variants/:skuCode', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { skuCode } = req.params;

    const variant = db.prepare('SELECT * FROM product_variants WHERE sku_code = ?').get(skuCode) as any;
    if (!variant) {
      return res.status(404).json({ success: false, error: '找不到欲刪除的規格 SKU' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      // Remove associated borrow records for this variant SKU
      db.prepare('DELETE FROM borrow_records WHERE sku_code = ?').run(skuCode);
      db.prepare('DELETE FROM product_variants WHERE sku_code = ?').run(skuCode);

      // Re-sum parent product
      const sumRow = db.prepare(`
        SELECT SUM(total_stock) as total_qty, SUM(reserved) as total_res
        FROM product_variants WHERE product_id = ?
      `).get(variant.product_id) as any;

      db.prepare(`
        UPDATE products
        SET quantity = ?, reserved_quantity = ?, updated_at = ?
        WHERE id = ?
      `).run(
        sumRow?.total_qty || 0,
        sumRow?.total_res || 0,
        new Date().toISOString(),
        variant.product_id
      );

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    recordAuditLog(req, 'DELETE_VARIANT', 'variant', skuCode, {
      deletedSku: skuCode,
      variantName: variant.variant_name,
    });

    return res.json({
      success: true,
      message: `規格【${skuCode}】已自資料庫刪除`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '刪除規格失敗：' + err.message });
  }
});

// ==========================================
// 4. Borrow Records & Rental Workflow
// ==========================================

/**
 * GET /api/borrows
 * Read borrow records (Publicly viewable by all users & visitors)
 */
apiRouter.get('/borrows', optionalAuth, (req: Request, res: Response) => {
  try {
    const { status, categoryId } = req.query;

    let query = `SELECT * FROM borrow_records WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(String(status));
    }

    if (categoryId) {
      query += ` AND category_id = ?`;
      params.push(String(categoryId));
    }

    query += ` ORDER BY created_at DESC`;

    const records = db.prepare(query).all(...params) as any[];

    const formatted = records.map((r) => ({
      id: r.id,
      borrowNumber: r.borrow_number,
      productId: r.product_id,
      categoryId: r.category_id,
      categoryName: r.category_name,
      subCategory: r.subcategory,
      modelCode: r.model_code,
      modelName: r.model_name,
      skuCode: r.sku_code,
      variantName: r.variant_name,
      borrower: r.borrower,
      borrowerId: r.borrower_id,
      department: r.department,
      quantity: r.quantity,
      purpose: r.purpose,
      borrowDate: r.borrow_date,
      expectedReturnDate: r.expected_return_date,
      actualReturnDate: r.actual_return_date,
      status: r.status,
      notes: r.notes,
      auditComment: r.audit_comment,
      auditedBy: r.audited_by,
      auditedAt: r.audited_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return res.json({ success: true, borrows: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '查詢借調記錄失敗：' + err.message });
  }
});

/**
 * POST /api/borrows
 * Submit borrow application (Accessible to all users & visitors)
 */
apiRouter.post('/borrows', optionalAuth, (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      categoryName,
      subCategory,
      modelCode,
      modelName,
      skuCode,
      variantName,
      borrower,
      department,
      quantity,
      purpose,
      expectedReturnDate,
      notes,
    } = req.body;

    if (!modelCode || !skuCode || !borrower || !department || !expectedReturnDate) {
      return res.status(400).json({
        success: false,
        error: '必填欄位未填寫完整（品項、借調人員、部門、應歸還日皆為必填）',
      });
    }

    const borrowQty = Math.max(1, Number(quantity) || 1);

    // Verify stock availability
    const variant = db.prepare('SELECT total_stock, reserved FROM product_variants WHERE sku_code = ?').get(skuCode) as any;
    if (!variant) {
      return res.status(404).json({ success: false, error: `找不到規格【${skuCode}】` });
    }

    const available = variant.total_stock - variant.reserved;
    if (available < borrowQty) {
      return res.status(400).json({
        success: false,
        error: `在庫可用庫存不足（目前僅剩 ${available} 件可供借調）`,
      });
    }

    const recordId = `br-${Date.now()}`;
    const borrowNumber = `BR-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO borrow_records (
        id, borrow_number, category_id, category_name, subcategory,
        model_code, model_name, sku_code, variant_name, borrower, borrower_id,
        department, quantity, purpose, borrow_date, expected_return_date,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待審核', ?, ?, ?)
    `).run(
      recordId,
      borrowNumber,
      categoryId || 'no_tool',
      categoryName || 'No Tool',
      subCategory || '',
      modelCode,
      modelName || modelCode,
      skuCode,
      variantName || '預設規格',
      String(borrower).trim(),
      req.user ? req.user.id : 'usr-visitor',
      String(department).trim(),
      borrowQty,
      purpose ? String(purpose).trim() : '客戶展示',
      today,
      expectedReturnDate,
      notes ? String(notes).trim() : '',
      now,
      now
    );

    recordAuditLog(req, 'SUBMIT_BORROW', 'borrow', recordId, {
      borrowNumber,
      skuCode,
      quantity: borrowQty,
      borrower,
    });

    return res.status(201).json({
      success: true,
      borrowId: recordId,
      borrowNumber,
      message: `借調申請單【${borrowNumber}】已成功送交審核！`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '申請失敗：' + err.message });
  }
});

/**
 * PUT /api/borrows/:id/status
 * Approve / Reject / Return borrow application (Manager or Admin only)
 */
apiRouter.put('/borrows/:id/status', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, auditComment } = req.body; // 'approve' | 'reject' | 'return'

    const record = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(id) as any;
    if (!record) {
      return res.status(404).json({ success: false, error: '找不到指定借調紀錄' });
    }

    const now = new Date().toISOString();
    const formattedNow = now.slice(0, 16).replace('T', ' ');

    db.exec('BEGIN TRANSACTION;');
    try {
      if (action === 'approve') {
        if (record.status !== '待審核') {
          db.exec('ROLLBACK;');
          return res.status(400).json({ success: false, error: '僅有待審核狀態之單據可進行核准' });
        }

        // Increase reserved stock for the variant
        db.prepare(`
          UPDATE product_variants
          SET reserved = reserved + ?,
              updated_at = ?
          WHERE sku_code = ?
        `).run(record.quantity, now, record.sku_code);

        // Update product reserved sum
        db.prepare(`
          UPDATE products
          SET reserved_quantity = reserved_quantity + ?,
              updated_at = ?
          WHERE product_code = ?
        `).run(record.quantity, now, record.model_code);

        // Update record status to '借用中'
        db.prepare(`
          UPDATE borrow_records
          SET status = '借用中',
              audit_comment = COALESCE(?, audit_comment),
              audited_by = ?,
              audited_at = ?,
              updated_at = ?
          WHERE id = ?
        `).run(auditComment || '管理者已核准出借', req.user!.name, formattedNow, now, id);

        // Log transaction
        db.prepare(`
          INSERT INTO stock_transactions (
            id, product_id, sku_code, type, quantity, previous_stock, new_stock,
            reference_id, reason, operator_name, operator_id, created_at
          ) VALUES (?, ?, ?, 'BORROW', ?, 0, 0, ?, '樣品核准出借 (扣抵預留在庫)', ?, ?, ?)
        `).run(
          `tx-${Date.now()}`,
          record.product_id,
          record.sku_code,
          record.quantity,
          record.borrow_number,
          req.user!.name,
          req.user!.id,
          now
        );
      } else if (action === 'return') {
        if (record.status !== '借用中') {
          db.exec('ROLLBACK;');
          return res.status(400).json({ success: false, error: '非借用中狀態之單據無法登記歸還' });
        }

        // Release reserved stock for the variant
        db.prepare(`
          UPDATE product_variants
          SET reserved = MAX(0, reserved - ?),
              updated_at = ?
          WHERE sku_code = ?
        `).run(record.quantity, now, record.sku_code);

        db.prepare(`
          UPDATE products
          SET reserved_quantity = MAX(0, reserved_quantity - ?),
              updated_at = ?
          WHERE product_code = ?
        `).run(record.quantity, now, record.model_code);

        // Update status to '已歸還'
        db.prepare(`
          UPDATE borrow_records
          SET status = '已歸還',
              actual_return_date = ?,
              audited_by = ?,
              updated_at = ?
          WHERE id = ?
        `).run(now.slice(0, 10), req.user!.name, now, id);

        // Log return transaction
        db.prepare(`
          INSERT INTO stock_transactions (
            id, product_id, sku_code, type, quantity, previous_stock, new_stock,
            reference_id, reason, operator_name, operator_id, created_at
          ) VALUES (?, ?, ?, 'RETURN', ?, 0, 0, ?, '樣品歸還入庫銷案', ?, ?, ?)
        `).run(
          `tx-${Date.now()}`,
          record.product_id,
          record.sku_code,
          record.quantity,
          record.borrow_number,
          req.user!.name,
          req.user!.id,
          now
        );
      } else if (action === 'reject') {
        db.prepare(`
          UPDATE borrow_records
          SET status = '已駁回',
              audit_comment = ?,
              audited_by = ?,
              audited_at = ?,
              updated_at = ?
          WHERE id = ?
        `).run(auditComment || '管理者已駁回此申請', req.user!.name, formattedNow, now, id);
      }

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    recordAuditLog(req, `BORROW_${action.toUpperCase()}`, 'borrow', id, {
      borrowNumber: record.borrow_number,
      action,
      auditedBy: req.user!.name,
    });

    return res.json({
      success: true,
      message: `單據【${record.borrow_number}】已成功執行【${
        action === 'approve' ? '核准出借' : action === 'return' ? '登記歸還' : '駁回'
      }】！`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '更新借調單據狀態失敗：' + err.message });
  }
});

/**
 * DELETE /api/borrows/:id
 * Delete borrow record (Admin only)
 */
apiRouter.delete('/borrows/:id', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = db.prepare('SELECT * FROM borrow_records WHERE id = ? OR borrow_number = ?').get(id, id) as any;
    if (!record) {
      return res.status(404).json({ success: false, error: '找不到指定借調紀錄' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      // If it was '借用中', restore reserved quantity
      if (record.status === '借用中') {
        db.prepare(`
          UPDATE product_variants
          SET reserved = MAX(0, reserved - ?)
          WHERE sku_code = ?
        `).run(record.quantity, record.sku_code);

        db.prepare(`
          UPDATE products
          SET reserved_quantity = MAX(0, reserved_quantity - ?)
          WHERE product_code = ?
        `).run(record.quantity, record.model_code);
      }

      db.prepare('DELETE FROM borrow_records WHERE id = ?').run(record.id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    recordAuditLog(req, 'DELETE_BORROW', 'borrow', record.id, { borrowNumber: record.borrow_number });

    return res.json({
      success: true,
      message: `借調記錄【${record.borrow_number}】已自資料庫刪除`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '刪除失敗：' + err.message });
  }
});

// ==========================================
// 5. Audit Logs & Users Management (Admin)
// ==========================================

/**
 * GET /api/audit-logs
 * List Audit History (Admin only)
 */
apiRouter.get('/audit-logs', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all() as any[];
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '讀取稽核日誌失敗：' + err.message });
  }
});

/**
 * GET /api/inventory/transactions
 * List stock movements (Publicly readable)
 */
apiRouter.get('/inventory/transactions', optionalAuth, (_req: Request, res: Response) => {
  try {
    const txs = db.prepare('SELECT * FROM stock_transactions ORDER BY created_at DESC LIMIT 100').all() as any[];
    return res.json({ success: true, transactions: txs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '讀取異動紀錄失敗：' + err.message });
  }
});

/**
 * GET /api/users
 * List users (Admin only)
 */
apiRouter.get('/users', requireAuth, requireRole(['admin']), (_req: Request, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT id, email, name, department, role, status, created_at, updated_at
      FROM users
      ORDER BY created_at ASC
    `).all() as any[];
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '讀取使用者名單失敗：' + err.message });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (Admin only)
 */
apiRouter.put('/users/:id/role', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({ success: false, error: '無效的角色類型' });
    }

    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(
      role,
      new Date().toISOString(),
      id
    );

    recordAuditLog(req, 'UPDATE_USER_ROLE', 'user', id, { newRole: role });
    return res.json({ success: true, message: '使用者權限已成功更新！' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '更新角色失敗：' + err.message });
  }
});

/**
 * GET /api/backup
 * Complete Database Snapshot Export (Admin only)
 */
apiRouter.get('/backup', requireAuth, requireRole(['admin']), (_req: Request, res: Response) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    const variants = db.prepare('SELECT * FROM product_variants').all();
    const borrows = db.prepare('SELECT * FROM borrow_records').all();
    const users = db.prepare('SELECT id, email, name, department, role, status, created_at FROM users').all();
    const transactions = db.prepare('SELECT * FROM stock_transactions').all();

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      snapshot: {
        products,
        variants,
        borrows,
        users,
        transactions,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '備份失敗：' + err.message });
  }
});

// ==========================================
// 6. Notices (新品通知與動態)
// ==========================================

/**
 * GET /api/notices
 * Fetch all notices sorted by newest first
 */
apiRouter.get('/notices', optionalAuth, (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM notices ORDER BY created_at DESC LIMIT 100').all() as any[];
    const notices = rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      summary: r.summary,
      modelCode: r.model_code,
      skuCode: r.sku_code,
      targetCategoryId: r.target_category_id,
      categoryName: r.category_name,
      quantity: r.quantity,
      date: r.date,
      isRead: r.is_read === 1,
      tagColor: r.tag_color,
      createdAt: r.created_at,
    }));
    return res.json({ success: true, notices });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '讀取新品通知失敗：' + err.message });
  }
});

/**
 * PATCH /api/notices/:id/read
 * Mark a notice as read
 */
apiRouter.patch('/notices/:id/read', optionalAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notices SET is_read = 1 WHERE id = ?').run(id);
    return res.json({ success: true, message: '通知已標示為已讀' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '更新失敗：' + err.message });
  }
});

/**
 * POST /api/notices/mark-all-read
 * Mark all notices as read
 */
apiRouter.post('/notices/mark-all-read', optionalAuth, (_req: Request, res: Response) => {
  try {
    db.prepare('UPDATE notices SET is_read = 1').run();
    return res.json({ success: true, message: '所有通知已標示為已讀' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '更新失敗：' + err.message });
  }
});

/**
 * DELETE /api/notices/:id
 * Delete a notice (Admin & Manager)
 */
apiRouter.delete('/notices/:id', requireAuth, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM notices WHERE id = ?').run(id);
    return res.json({ success: true, message: '通知已成功刪除' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '刪除失敗：' + err.message });
  }
});

