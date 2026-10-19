import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { INITIAL_CATEGORIES } from '../data/inventoryData';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'production.db');

function openDatabase(): DatabaseSync {
  try {
    const instance = new DatabaseSync(DB_PATH);
    instance.exec('PRAGMA journal_mode = WAL;');
    instance.exec('PRAGMA foreign_keys = ON;');
    instance.exec('PRAGMA synchronous = NORMAL;');
    return instance;
  } catch (err: any) {
    console.error('[Database] Failed to open database cleanly (may be malformed or locked):', err);
    if (fs.existsSync(DB_PATH)) {
      const backupPath = `${DB_PATH}.corrupt.${Date.now()}`;
      try {
        fs.renameSync(DB_PATH, backupPath);
        if (fs.existsSync(`${DB_PATH}-wal`)) fs.renameSync(`${DB_PATH}-wal`, `${backupPath}-wal`);
        if (fs.existsSync(`${DB_PATH}-shm`)) fs.renameSync(`${DB_PATH}-shm`, `${backupPath}-shm`);
        console.warn(`[Database] Moved malformed database to ${backupPath} and recreating clean database.`);
      } catch (renameErr) {
        console.error('[Database] Could not rename corrupted database:', renameErr);
      }
    }
    const fresh = new DatabaseSync(DB_PATH);
    fresh.exec('PRAGMA journal_mode = WAL;');
    fresh.exec('PRAGMA foreign_keys = ON;');
    fresh.exec('PRAGMA synchronous = NORMAL;');
    return fresh;
  }
}

export const db = openDatabase();

/**
 * Initialize Database Tables and Schema Migrations
 */
export function initDatabase() {
  db.exec(`
    -- 1. Users & Authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT DEFAULT '行銷企劃課',
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subcategories TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER DEFAULT 0
    );

    -- 3. Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      product_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      subcategory TEXT DEFAULT '',
      im_om TEXT DEFAULT 'OM',
      size_dimensions TEXT DEFAULT '',
      material TEXT DEFAULT '',
      color TEXT DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0,
      reserved_quantity INTEGER NOT NULL DEFAULT 0,
      safety_stock INTEGER NOT NULL DEFAULT 5,
      location_bin TEXT DEFAULT '',
      product_status TEXT NOT NULL DEFAULT 'optimal' CHECK(product_status IN ('optimal', 'warning', 'danger')),
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      updated_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    -- 4. Product SKU Variants
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_code TEXT NOT NULL,
      sku_code TEXT UNIQUE NOT NULL,
      variant_name TEXT NOT NULL,
      color_hex TEXT DEFAULT '#ffffff',
      total_stock INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      safety_stock INTEGER NOT NULL DEFAULT 5,
      location_bin TEXT DEFAULT '',
      barcode TEXT DEFAULT '',
      unit_price REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'optimal',
      custom_image TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 5. Borrow Records
    CREATE TABLE IF NOT EXISTS borrow_records (
      id TEXT PRIMARY KEY,
      borrow_number TEXT UNIQUE NOT NULL,
      product_id TEXT,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      subcategory TEXT DEFAULT '',
      model_code TEXT NOT NULL,
      model_name TEXT NOT NULL,
      sku_code TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      borrower TEXT NOT NULL,
      borrower_id TEXT,
      department TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      purpose TEXT NOT NULL,
      borrow_date TEXT NOT NULL,
      expected_return_date TEXT NOT NULL,
      actual_return_date TEXT,
      status TEXT NOT NULL DEFAULT '待審核' CHECK(status IN ('待審核', '借用中', '已歸還', '已駁回')),
      notes TEXT,
      audit_comment TEXT,
      audited_by TEXT,
      audited_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 6. Inventory Transactions (Permanent stock movements)
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      sku_code TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN', 'OUT', 'BORROW', 'RETURN', 'ADJUST')),
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_id TEXT,
      reason TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_id TEXT,
      created_at TEXT NOT NULL
    );

    -- 7. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    -- 8. New Notices (新品通知與動態)
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT '新品到庫',
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      model_code TEXT NOT NULL,
      sku_code TEXT NOT NULL,
      target_category_id TEXT NOT NULL,
      category_name TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      tag_color TEXT NOT NULL DEFAULT 'bg-[#e2f1e6] text-[#2c5f40]',
      created_at TEXT NOT NULL
    );

    -- Indexes for high-speed querying
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
    CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku_code);
    CREATE INDEX IF NOT EXISTS idx_variants_prod ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_borrows_status ON borrow_records(status);
    CREATE INDEX IF NOT EXISTS idx_borrows_sku ON borrow_records(sku_code);
    CREATE INDEX IF NOT EXISTS idx_tx_sku ON stock_transactions(sku_code);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_notices_read ON notices(is_read);
    CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at);
  `);

  seedInitialData();
}

/**
 * Seed initial real users and products if database is empty
 */
function seedInitialData() {
  // Check users count
  const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCountRow.count === 0) {
    const now = new Date().toISOString();
    const defaultPasswordHash = bcrypt.hashSync('cfd0000', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, department, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Super Admin: Paul Wang
    insertUser.run(
      'usr-admin-01',
      'paulwang8827@gmail.com',
      defaultPasswordHash,
      'Paul Wang',
      '企劃管理部',
      'admin',
      'active',
      now,
      now
    );

    // 2. Manager Account
    insertUser.run(
      'usr-manager-01',
      'manager@cfd.internal',
      defaultPasswordHash,
      '陳主管',
      '行銷企劃課',
      'manager',
      'active',
      now,
      now
    );

    // 3. General Staff User Account
    insertUser.run(
      'usr-user-01',
      'user@cfd.internal',
      defaultPasswordHash,
      '王專員',
      '業務部',
      'user',
      'active',
      now,
      now
    );

    console.log('[Database] Seeded 3 system users (Admin: paulwang8827@gmail.com, Manager, User)');
  }

  // Check and seed categories from INITIAL_CATEGORIES
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, subcategories, sort_order)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, subcategories = excluded.subcategories, sort_order = excluded.sort_order
  `);

  let catOrder = 1;
  for (const cat of INITIAL_CATEGORIES) {
    insertCat.run(cat.id, cat.name, JSON.stringify(cat.subCategories || []), catOrder++);
  }

  // Ensure all original series models and variants from INITIAL_CATEGORIES exist with English names
  const now = new Date().toISOString();

  const upsertProd = db.prepare(`
    INSERT INTO products (
      id, product_code, product_name, category_id, category_name, subcategory,
      im_om, size_dimensions, material, color, quantity, reserved_quantity,
      safety_stock, location_bin, product_status, description, image_url,
      created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(product_code) DO UPDATE SET
      product_name = excluded.product_name,
      category_id = excluded.category_id,
      category_name = excluded.category_name,
      subcategory = excluded.subcategory,
      size_dimensions = excluded.size_dimensions,
      material = excluded.material,
      color = excluded.color,
      quantity = excluded.quantity,
      reserved_quantity = excluded.reserved_quantity,
      safety_stock = excluded.safety_stock,
      product_status = excluded.product_status,
      description = excluded.description,
      image_url = CASE
        WHEN products.image_url IS NULL OR products.image_url = '' OR products.image_url LIKE '%shade_no_tool_ezstick%' THEN excluded.image_url
        ELSE products.image_url
      END,
      updated_at = excluded.updated_at
  `);

  const upsertVariant = db.prepare(`
    INSERT INTO product_variants (
      id, product_id, product_code, sku_code, variant_name, color_hex,
      total_stock, reserved, safety_stock, location_bin, barcode,
      unit_price, status, custom_image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sku_code) DO UPDATE SET
      variant_name = excluded.variant_name,
      color_hex = excluded.color_hex,
      total_stock = excluded.total_stock,
      reserved = excluded.reserved,
      safety_stock = excluded.safety_stock,
      location_bin = excluded.location_bin,
      barcode = excluded.barcode,
      unit_price = excluded.unit_price,
      status = excluded.status,
      custom_image = CASE
        WHEN product_variants.custom_image IS NULL OR product_variants.custom_image = '' THEN excluded.custom_image
        ELSE product_variants.custom_image
      END,
      updated_at = excluded.updated_at
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const cat of INITIAL_CATEGORIES) {
      for (const m of cat.models) {
        const prodId = 'prod-' + m.code.toLowerCase();
        const totalStock = (m.variants || []).reduce((acc, v) => acc + (v.totalStock || 0), 0);
        const totalReserved = (m.variants || []).reduce((acc, v) => acc + (v.reserved || 0), 0);
        const colors = (m.variants || []).map((v) => v.name).join(' / ');
        const bin = m.variants?.[0]?.locationBin || 'A-01';

        upsertProd.run(
          prodId,
          m.code,
          m.name,
          cat.id,
          cat.name,
          m.subCategory || '',
          'OM',
          m.dimensions || '',
          m.material || '',
          colors,
          totalStock,
          totalReserved,
          0,
          bin,
          totalStock - totalReserved > 0 ? 'optimal' : 'warning',
          m.description || '',
          m.image || '',
          'Paul Wang',
          'Paul Wang',
          now,
          now
        );

        for (const v of m.variants || []) {
          const varId = 'var-' + v.code.toLowerCase();
          const stock = v.totalStock !== undefined ? v.totalStock : 1;
          const res = v.reserved || 0;
          upsertVariant.run(
            varId,
            prodId,
            m.code,
            v.code,
            v.name,
            v.colorHex || '#ffffff',
            stock,
            res,
            v.safetyStock !== undefined ? v.safetyStock : 0,
            v.locationBin || bin,
            v.barcode || '',
            v.unitPrice || 0,
            stock - res > 0 ? 'optimal' : 'warning',
            v.customImage || '',
            now,
            now
          );
        }
      }
    }
    db.exec('COMMIT;');
    console.log('[Database] Successfully populated all 7 categories and 44 series items with English names.');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[Database] Failed to upsert initial categories & products:', err);
  }

  // Seed Sample Borrow Records
  const borrowCountRow = db.prepare('SELECT COUNT(*) as count FROM borrow_records').get() as { count: number };
  if (borrowCountRow.count === 0) {
    const insertBorrow = db.prepare(`
      INSERT INTO borrow_records (
        id, borrow_number, product_id, category_id, category_name, subcategory,
        model_code, model_name, sku_code, variant_name, borrower, borrower_id,
        department, quantity, purpose, borrow_date, expected_return_date, actual_return_date,
        status, notes, audit_comment, audited_by, audited_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBorrow.run(
      'br-001',
      'BR-2026-001',
      'prod-ed',
      'no_tool',
      'No Tool',
      'EZ Stick',
      'ED',
      'EZ Stick Roller Shade 專業無痕遮光捲簾',
      'ED-001',
      '雪白 White',
      '張小明',
      'usr-user-01',
      '業務一部',
      1,
      '客戶展示',
      '2026-10-01',
      '2026-10-15',
      null,
      '借用中',
      '帶至台北世貿建材展向客戶實機操作說明 (樣品出借 1 件)',
      '核准出借，請依期歸還樣品。',
      'Paul Wang',
      '2026-10-01 10:30',
      now,
      now
    );

    insertBorrow.run(
      'br-002',
      'BR-2026-002',
      'prod-ef',
      'no_tool',
      'No Tool',
      'EZ Fit',
      'EF',
      'EZ Fit Tension Cellular Shade 氣壓伸縮蜂巢簾',
      'EF-001',
      '純白 Pure White',
      '李專員',
      'usr-user-01',
      '行銷企劃課',
      1,
      '行銷展演',
      '2026-10-05',
      '2026-10-12',
      null,
      '借用中',
      '新品形象宣傳短片拍攝借調 (樣品出借 1 件)',
      '拍攝樣品請小心維持品相乾淨。',
      'Paul Wang',
      '2026-10-05 14:15',
      now,
      now
    );

    // Seed Initial Transactions
    const insertTx = db.prepare(`
      INSERT INTO stock_transactions (
        id, product_id, sku_code, type, quantity, previous_stock, new_stock,
        reference_id, reason, operator_name, operator_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTx.run(
      'tx-001',
      'prod-ed',
      'ED-001',
      'IN',
      1,
      0,
      1,
      'PO-INIT',
      '初始系統建檔入庫',
      'Paul Wang',
      'usr-admin-01',
      now
    );

    insertTx.run(
      'tx-002',
      'prod-ed',
      'ED-001',
      'BORROW',
      1,
      1,
      0,
      'BR-2026-001',
      '客戶展示借出 (預扣在席)',
      'Paul Wang',
      'usr-admin-01',
      now
    );

    // Initial Audit Log
    db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, user_id, user_name, user_role, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'log-init-01',
      'SYSTEM_INIT',
      'system',
      'production_db',
      'usr-admin-01',
      'Paul Wang',
      'admin',
      JSON.stringify({ message: '系統資料庫初始化與種子資料寫入完成' }),
      '127.0.0.1',
      now
    );

    console.log('[Database] Seeded initial production products, variants, and borrow records.');
  }

  // Ensure initial notice if table empty
  try {
    const noticeCountRow = db.prepare('SELECT COUNT(*) as count FROM notices').get() as { count: number };
    if (noticeCountRow.count === 0) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO notices (
          id, category, title, summary, model_code, sku_code,
          target_category_id, category_name, quantity, date, is_read, tag_color, created_at
        ) VALUES (?, '新品到庫', ?, ?, ?, ?, ?, ?, ?, ?, 1, 'bg-[#e2f1e6] text-[#2c5f40]', ?)
      `).run(
        'not-init-01',
        '【免打孔系列】ED EZ Stick 首發展示樣品已完成入庫',
        '次分類：EZ Stick ｜ 規格：ED-001 (Standard White) ｜ 初始入庫數量：1 件 ｜ 儲位：NT-ED-01',
        'ED',
        'ED-001',
        'no_tool',
        'No Tool 無痕黏貼系列',
        1,
        now.slice(0, 10),
        now
      );
    }
  } catch (err) {
    console.warn('Initial notice seeding notice:', err);
  }
}
