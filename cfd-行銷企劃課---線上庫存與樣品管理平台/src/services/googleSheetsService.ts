import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MainCategory, BorrowRecord, StockTransaction, ProductModel, VariantSKU } from '../types/inventory';
import { INITIAL_CATEGORIES } from '../data/inventoryData';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google Auth Provider with Google Sheets and Google Drive File scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('無法取得 Google 授權 Access Token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google 登入失敗:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const SPREADSHEET_TITLE = 'CFD 行銷企劃課 - 樣品庫存管理表';
const SHEET_NAMES = {
  INVENTORY: '庫存總表',
  BORROWS: '借調紀錄',
  TRANSACTIONS: '庫存異動紀錄',
};

/**
 * Ensure required sheets exist in spreadsheet
 */
export const ensureSheetsExist = async (accessToken: string, spreadsheetId: string) => {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return;
    const data = await res.json();
    const existingTitles: string[] = (data.sheets || []).map((s: any) => s.properties?.title);

    const needed = [SHEET_NAMES.INVENTORY, SHEET_NAMES.BORROWS, SHEET_NAMES.TRANSACTIONS];
    const toAdd = needed.filter((n) => !existingTitles.includes(n));

    if (toAdd.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: toAdd.map((title) => ({
            addSheet: { properties: { title } },
          })),
        }),
      });
    }
  } catch (err) {
    console.warn('ensureSheetsExist check notice:', err);
  }
};

/**
 * Find existing spreadsheet or create a new one in user's Google Drive
 */
export const findOrCreateSpreadsheet = async (
  accessToken: string
): Promise<{ spreadsheetId: string; webViewLink?: string }> => {
  try {
    // 1. Search existing file in Google Drive
    const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and trashed = false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const file = searchData.files[0];
        localStorage.setItem('cfd_sheets_spreadsheet_id', file.id);
        await ensureSheetsExist(accessToken, file.id);
        return { spreadsheetId: file.id, webViewLink: file.webViewLink };
      }
    }

    // 2. Create new spreadsheet if not found
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SPREADSHEET_TITLE,
        },
        sheets: [
          { properties: { title: SHEET_NAMES.INVENTORY } },
          { properties: { title: SHEET_NAMES.BORROWS } },
          { properties: { title: SHEET_NAMES.TRANSACTIONS } },
        ],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`建立 Google 試算表失敗: ${errText}`);
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;
    localStorage.setItem('cfd_sheets_spreadsheet_id', spreadsheetId);

    return {
      spreadsheetId,
      webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  } catch (error) {
    console.error('尋找或建立試算表錯誤:', error);
    throw error;
  }
};

/**
 * Format Categories array into flat rows for Google Sheets
 */
export const categoriesToRows = (categories: MainCategory[]): (string | number)[][] => {
  const headers = [
    '大分類ID',
    '大分類名稱',
    '子分類',
    '型號代碼',
    '型號品名',
    '規格SKU',
    '規格顏色',
    '顏色色碼',
    '在庫總量',
    '預扣數量',
    '安全庫存',
    '儲位',
    '條碼',
    '單價',
    '狀態',
    '實拍照片網址',
    '商品說明',
  ];

  const rows: (string | number)[][] = [headers];

  for (const cat of categories) {
    for (const model of cat.models) {
      for (const v of model.variants) {
        // Prevent Google Sheets 50,000 char per cell limit on base64
        const safeCustomImage =
          v.customImage && v.customImage.length < 40000 ? v.customImage : '';

        rows.push([
          cat.id,
          cat.name,
          model.subCategory || '',
          model.code,
          model.name,
          v.code,
          v.name,
          v.colorHex || '',
          v.totalStock,
          v.reserved,
          v.safetyStock,
          v.locationBin,
          v.barcode,
          v.unitPrice,
          v.status,
          safeCustomImage,
          model.description || '',
        ]);
      }
    }
  }

  return rows;
};

/**
 * Parse rows back into Categories array
 */
export const rowsToCategories = (
  rows: (string | number)[][],
  templateCategories: MainCategory[] = INITIAL_CATEGORIES
): MainCategory[] => {
  if (!rows || rows.length <= 1) return templateCategories;

  // Clone template structure to preserve categories & subcategories metadata
  const catMap = new Map<string, MainCategory>();

  // Deep clone initial template structure
  for (const c of templateCategories) {
    catMap.set(c.id, {
      ...c,
      models: [],
    });
  }

  // Group rows (starting from row index 1 to skip header)
  const modelMap = new Map<string, ProductModel>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 6) continue;

    const catId = String(row[0] || 'no_tool');
    const catName = String(row[1] || 'No Tool');
    const subCat = String(row[2] || '');
    const modelCode = String(row[3] || '');
    const modelName = String(row[4] || '');
    const skuCode = String(row[5] || '');
    const skuName = String(row[6] || '');
    const colorHex = String(row[7] || '#ffffff');
    const totalStock = Number(row[8]) || 0;
    const reserved = Number(row[9]) || 0;
    const safetyStock = Number(row[10]) || 5;
    const locationBin = String(row[11] || '');
    const barcode = String(row[12] || '');
    const unitPrice = Number(row[13]) || 0;
    const status = (String(row[14]) as any) || 'optimal';
    const customImage = String(row[15] || '');
    const description = String(row[16] || '');

    if (!catMap.has(catId)) {
      catMap.set(catId, {
        id: catId,
        name: catName,
        subCategories: subCat ? [{ id: subCat, name: subCat }] : [],
        models: [],
      });
    }

    const modelKey = `${catId}_${modelCode}`;
    if (!modelMap.has(modelKey)) {
      // Find template model for dimensions, material, fallback image
      const templateModel = templateCategories
        .flatMap((c) => c.models)
        .find((m) => m.code === modelCode);

      const newModel: ProductModel = {
        code: modelCode,
        name: modelName,
        subCategory: subCat,
        image: templateModel?.image || '',
        description: description || templateModel?.description || '',
        material: templateModel?.material || '鋁合金 / 聚酯纖維',
        dimensions: templateModel?.dimensions || 'W: 36" × H: 72"',
        variants: [],
      };
      modelMap.set(modelKey, newModel);
      catMap.get(catId)!.models.push(newModel);
    }

    const currentModel = modelMap.get(modelKey)!;
    const newVariant: VariantSKU = {
      code: skuCode,
      name: skuName,
      colorHex,
      totalStock,
      reserved,
      safetyStock,
      locationBin,
      barcode,
      unitPrice,
      status,
      customImage: customImage || undefined,
      warehouses: [
        { warehouseId: 'W1', name: '企劃樣品庫', onHand: Math.max(0, totalStock - reserved), reserved },
      ],
    };

    currentModel.variants.push(newVariant);
  }

  return Array.from(catMap.values());
};

/**
 * Format Borrows array into flat rows for Google Sheets
 */
export const borrowsToRows = (borrows: BorrowRecord[]): (string | number)[][] => {
  const headers = [
    '借調單號',
    '項目系列ID',
    '項目系列名稱',
    '子系列',
    '型號代碼',
    '型號名稱',
    '規格SKU',
    '規格名稱',
    '借調人員',
    '部門',
    '借調數量',
    '用途',
    '借調日期',
    '應歸還日',
    '實際歸還日',
    '狀態',
    '申請備註',
    '審核備註',
    '審核人',
    '審核時間',
  ];

  const rows: (string | number)[][] = [headers];

  for (const b of borrows) {
    rows.push([
      b.id,
      b.categoryId,
      b.categoryName,
      b.subCategory || '',
      b.modelCode,
      b.modelName,
      b.skuCode,
      b.variantName,
      b.borrower,
      b.department,
      b.quantity,
      b.purpose,
      b.borrowDate,
      b.expectedReturnDate,
      b.actualReturnDate || '',
      b.status,
      b.notes || '',
      b.auditComment || '',
      b.auditedBy || '',
      b.auditedAt || '',
    ]);
  }

  return rows;
};

/**
 * Parse rows back into Borrows array
 */
export const rowsToBorrows = (rows: (string | number)[][]): BorrowRecord[] => {
  if (!rows || rows.length <= 1) return [];

  const list: BorrowRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 10) continue;

    list.push({
      id: String(row[0] || ''),
      categoryId: String(row[1] || 'no_tool'),
      categoryName: String(row[2] || 'No Tool 系列'),
      subCategory: String(row[3] || ''),
      modelCode: String(row[4] || ''),
      modelName: String(row[5] || ''),
      skuCode: String(row[6] || ''),
      variantName: String(row[7] || ''),
      borrower: String(row[8] || ''),
      department: String(row[9] || ''),
      quantity: Number(row[10]) || 1,
      purpose: String(row[11] || '客戶展示'),
      borrowDate: String(row[12] || ''),
      expectedReturnDate: String(row[13] || ''),
      actualReturnDate: String(row[14] || undefined),
      status: (String(row[15]) as any) || '待審核',
      notes: String(row[16] || undefined),
      auditComment: String(row[17] || undefined),
      auditedBy: String(row[18] || undefined),
      auditedAt: String(row[19] || undefined),
    });
  }

  return list;
};

/**
 * Sync entire inventory and records to Google Sheets
 */
export const syncAllToGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string,
  categories: MainCategory[],
  borrows: BorrowRecord[],
  transactions: StockTransaction[] = []
): Promise<boolean> => {
  try {
    await ensureSheetsExist(accessToken, spreadsheetId);
    const invRows = categoriesToRows(categories);
    const borrowRows = borrowsToRows(borrows);

    // 1. Clear old values and write inventory
    const clearInvRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.INVENTORY + '!A:Q')}:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!clearInvRes.ok) console.warn('Clear inventory sheet notice:', await clearInvRes.text());

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.INVENTORY + '!A1')}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET_NAMES.INVENTORY}!A1`,
          majorDimension: 'ROWS',
          values: invRows,
        }),
      }
    );

    // 2. Clear old values and write borrows
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.BORROWS + '!A:T')}:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.BORROWS + '!A1')}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET_NAMES.BORROWS}!A1`,
          majorDimension: 'ROWS',
          values: borrowRows,
        }),
      }
    );

    // Save local cache timestamp
    localStorage.setItem('cfd_last_sheets_sync', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('同步至 Google 試算表失敗:', error);
    return false;
  }
};

/**
 * Load all data from Google Sheets
 */
export const loadAllFromGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ categories: MainCategory[] | null; borrows: BorrowRecord[] | null } | null> => {
  try {
    // 1. Read Inventory Sheet
    const invRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.INVENTORY + '!A1:Q500')}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    let categories: MainCategory[] | null = null;
    if (invRes.ok) {
      const invData = await invRes.json();
      if (invData.values && invData.values.length > 1) {
        categories = rowsToCategories(invData.values);
      }
    }

    // 2. Read Borrows Sheet
    const borrowRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.BORROWS + '!A1:T500')}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    let borrows: BorrowRecord[] | null = null;
    if (borrowRes.ok) {
      const borrowData = await borrowRes.json();
      if (borrowData.values && borrowData.values.length > 1) {
        borrows = rowsToBorrows(borrowData.values);
      }
    }

    return { categories, borrows };
  } catch (error) {
    console.error('從 Google 試算表讀取資料失敗:', error);
    return null;
  }
};
