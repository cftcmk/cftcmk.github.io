export interface WarehouseStock {
  warehouseId: string;
  name: string;
  onHand: number;
  reserved: number;
}

export interface VariantSKU {
  code: string; // e.g. "001", "002" in orange
  name: string; // e.g. "White", "Dark Oak"
  colorHex?: string;
  totalStock: number;
  reserved: number;
  safetyStock: number;
  warehouses: WarehouseStock[];
  barcode: string;
  locationBin: string;
  unitPrice: number;
  status: 'optimal' | 'low' | 'out_of_stock';
  customImage?: string;
}

export interface ProductModel {
  id?: string;
  code: string; // e.g. "BD", "BC", "QJ", "QK", "PQL"
  name: string; // e.g. "Section A-1 (Fixed Size)", "2\" Premium Cordless Aluminum Blind"
  subCategory: string; // e.g. "EZ Stick", "Faux Wood"
  imOm?: string;
  color?: string;
  quantity?: number;
  reservedQuantity?: number;
  productStatus?: 'optimal' | 'warning' | 'danger' | string;
  image: string;
  description: string;
  material: string;
  dimensions: string;
  variants: VariantSKU[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  categoryId?: string;
  categoryName?: string;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface MainCategory {
  id: string;
  name: string;
  subCategories: SubCategory[];
  models: ProductModel[];
}

export interface StockTransaction {
  id: string;
  skuCode: string;
  modelCode: string;
  modelName: string;
  variantName: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'AUDIT';
  quantity: number;
  warehouse: string;
  reason: string;
  operator: string;
  timestamp: string;
}

export interface BorrowRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  subCategory?: string;
  modelCode: string;
  modelName: string;
  skuCode: string;
  variantName: string;
  borrower: string;
  department: string;
  quantity: number;
  purpose: '行銷展演' | '客戶展示' | '設計打樣' | '新品發布拍攝' | string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: '待審核' | '借用中' | '已歸還' | '逾期待還' | '已駁回';
  notes?: string;
  auditComment?: string;
  auditedBy?: string;
  auditedAt?: string;
}

