import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPortal } from './components/AuthPortal';
import { api } from './services/api';
import { MainCategory, StockTransaction, BorrowRecord, ProductModel, VariantSKU } from './types/inventory';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProductModelList } from './components/ProductModelList';
import { VariantDetailPanel } from './components/VariantDetailPanel';
import { NewNoticesView, NoticeItem, INITIAL_NOTICES } from './components/NewNoticesView';
import { INITIAL_CATEGORIES, INITIAL_BORROWS, INITIAL_TRANSACTIONS } from './data/inventoryData';
import { BorrowStatusView } from './components/BorrowStatusView';
import { AddItemModal } from './components/AddItemModal';
import { BorrowModal } from './components/BorrowModal';
import { DocCardModal } from './components/DocCardModal';
import { EditStockModal } from './components/EditStockModal';
import { EditModelModal } from './components/EditModelModal';
import { UploadImageModal } from './components/UploadImageModal';
import { AdminAuditLogsModal } from './components/AdminAuditLogsModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { ShareModal } from './components/ShareModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  findOrCreateSpreadsheet,
  syncAllToGoogleSheets,
  getAccessToken,
  SPREADSHEET_TITLE,
} from './services/googleSheetsService';

function InventoryManagementApp() {
  const { user, isAuthenticated, isLoading: isAuthLoading, login, logout } = useAuth();

  // Database loaded state - default to complete initial dataset so incognito and guests always see normal interface
  const [categories, setCategories] = useState<MainCategory[]>(INITIAL_CATEGORIES);
  const [borrows, setBorrows] = useState<BorrowRecord[]>(INITIAL_BORROWS);
  const [transactions, setTransactions] = useState<StockTransaction[]>(INITIAL_TRANSACTIONS);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Google Sheets integration state
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(() => {
    return !!localStorage.getItem('cfd_sheets_spreadsheet_id');
  });
  const [isSheetsSyncing, setIsSheetsSyncing] = useState<boolean>(false);
  const [sheetsSpreadsheetUrl, setSheetsSpreadsheetUrl] = useState<string>(() => {
    const id = localStorage.getItem('cfd_sheets_spreadsheet_id');
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : '';
  });
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('cfd_sheets_spreadsheet_id') || null;
  });

  // Top navigation tab: 'inventory' | 'new_notices' | 'borrow_status' | 'admin_login'
  const [activeTab, setActiveTab] = useState<'inventory' | 'new_notices' | 'borrow_status' | 'admin_login'>('inventory');

  // Notices state with persistence
  const [notices, setNotices] = useState<NoticeItem[]>(() => {
    try {
      const saved = localStorage.getItem('cfd_sample_notices');
      return saved ? JSON.parse(saved) : INITIAL_NOTICES;
    } catch {
      return INITIAL_NOTICES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cfd_sample_notices', JSON.stringify(notices));
    } catch {}
  }, [notices]);

  // Selected Category, Subcategory, Model & Variant
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('no_tool');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('EZ Stick');
  const [selectedModelCode, setSelectedModelCode] = useState<string>('ED');
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>('ED-001');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditModelModalOpen, setIsEditModelModalOpen] = useState<boolean>(false);
  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState<boolean>(false);
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState<boolean>(false);

  // Delete Confirmation Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    itemDescription: string;
    warningText?: string;
    isDeleting?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    itemDescription: '',
    onConfirm: async () => {},
  });

  const [modalTargetModel, setModalTargetModel] = useState<ProductModel | null>(null);
  const [modalTargetVariant, setModalTargetVariant] = useState<VariantSKU | null>(null);

  const [globalToast, setGlobalToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setGlobalToast({ message, type });
    setTimeout(() => setGlobalToast(null), 3500);
  };

  /**
   * Load real data from Database via Backend API
   */
  const loadDatabaseData = useCallback(async (isInitial = false) => {
    if (isInitial && categories.length === 0) {
      setIsDataLoading(true);
    }
    setDataError(null);
    try {
      const [catsRes, prodsRes, borrowsRes, txRes, noticesRes] = await Promise.all([
        api.getCategories().catch((err) => {
          console.warn('Categories API fetch notice:', err);
          return null;
        }),
        api.getProducts().catch((err) => {
          console.warn('Products API fetch notice:', err);
          return null;
        }),
        api.getBorrows().catch((err) => {
          console.warn('Borrows load notice:', err);
          return null;
        }),
        api.getTransactions().catch((err) => {
          console.warn('Transactions load notice:', err);
          return null;
        }),
        api.getNotices().catch((err) => {
          console.warn('Notices load notice:', err);
          return null;
        }),
      ]);

      // If categories and products are available from DB, assemble them
      if (catsRes && prodsRes && Array.isArray(catsRes) && catsRes.length > 0) {
        const assembledCategories: MainCategory[] = catsRes.map((cat) => {
          const catProducts = Array.isArray(prodsRes) ? prodsRes.filter((p) => p.categoryId === cat.id) : [];
          const models: ProductModel[] = catProducts.map((p) => {
            const fallbackModel = INITIAL_CATEGORIES.flatMap((c) => c.models).find((m) => m.code === p.code);
            const mergedVariants = (p.variants && p.variants.length > 0)
              ? p.variants.map((v: any) => {
                  const fallbackVar = fallbackModel?.variants?.find((x) => x.code === v.code);
                  return {
                    ...v,
                    customImage: v.customImage || fallbackVar?.customImage || undefined,
                  };
                })
              : fallbackModel?.variants || [];

            return {
              id: p.id,
              code: p.code,
              name: p.name,
              categoryId: p.categoryId,
              categoryName: p.categoryName,
              subCategory: p.subCategory,
              imOm: p.imOm,
              color: p.color,
              quantity: p.quantity,
              reservedQuantity: p.reservedQuantity,
              productStatus: p.status,
              image: p.image || fallbackModel?.image || '',
              description: p.description,
              material: p.material,
              dimensions: p.dimensions,
              variants: mergedVariants,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              createdBy: p.createdBy,
              updatedBy: p.updatedBy,
            };
          });

          return {
            id: cat.id,
            name: cat.name,
            subCategories: cat.subCategories || [],
            models,
          };
        });

        setCategories(assembledCategories);

        // Verify selected model exists, otherwise safely select first without re-triggering loader
        setSelectedCategoryId((prevCatId) => {
          const currentCat = assembledCategories.find((c) => c.id === prevCatId) || assembledCategories[0];
          if (currentCat && currentCat.models.length > 0) {
            setSelectedModelCode((prevModelCode) => {
              const hasModel = currentCat.models.some((m) => m.code === prevModelCode);
              if (!hasModel) {
                const firstM = currentCat.models[0];
                setSelectedVariantCode(firstM.variants[0]?.code || '');
                return firstM.code;
              }
              return prevModelCode;
            });
          }
          return prevCatId || 'no_tool';
        });
      }

      if (borrowsRes && Array.isArray(borrowsRes) && borrowsRes.length > 0) {
        setBorrows(borrowsRes);
      }
      if (txRes && Array.isArray(txRes) && txRes.length > 0) {
        setTransactions(txRes);
      }
      if (noticesRes && Array.isArray(noticesRes) && noticesRes.length > 0) {
        setNotices(noticesRes);
      }
    } catch (err: any) {
      console.warn('Database sync notice (maintaining active dataset):', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [categories.length]);

  useEffect(() => {
    loadDatabaseData(true);
  }, [loadDatabaseData]);

  // Sync Helper to Google Sheets
  const triggerSheetsSync = async (cats = categories, brs = borrows) => {
    const token = googleAccessToken || (await getAccessToken());
    const sId = spreadsheetId || localStorage.getItem('cfd_sheets_spreadsheet_id');
    if (token && sId) {
      setIsSheetsSyncing(true);
      try {
        await syncAllToGoogleSheets(token, sId, cats, brs);
      } catch (err) {
        console.warn('Google Sheets sync warning:', err);
      } finally {
        setIsSheetsSyncing(false);
      }
    }
  };

  // Google Sheets connect handler
  const handleConnectGoogleSheets = async () => {
    if (googleAccessToken && spreadsheetId) {
      setIsSheetsSyncing(true);
      try {
        await syncAllToGoogleSheets(googleAccessToken, spreadsheetId, categories, borrows);
        showToast('已完成即時同步至 Google 試算表！');
      } catch {
        showToast('同步失敗，請檢查網路連線', 'error');
      } finally {
        setIsSheetsSyncing(false);
      }
      return;
    }

    try {
      setIsSheetsSyncing(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleAccessToken(res.accessToken);
        const { spreadsheetId: sId, webViewLink } = await findOrCreateSpreadsheet(res.accessToken);
        setSpreadsheetId(sId);
        setIsSheetsConnected(true);
        if (webViewLink) setSheetsSpreadsheetUrl(webViewLink);

        await syncAllToGoogleSheets(res.accessToken, sId, categories, borrows);
        showToast(`已成功串接 Google 試算表【${SPREADSHEET_TITLE}】，資料已同步！`);
      }
    } catch {
      showToast('Google 帳號授權未完成', 'error');
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  // Active Category Object
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || categories[0] || {
      id: 'no_tool',
      name: 'No Tool',
      subCategories: [],
      models: [],
    };
  }, [categories, selectedCategoryId]);

  // Handle switching category
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      if (cat.id === 'no_tool') {
        setSelectedSubCat('EZ Stick');
        setSelectedModelCode('ED');
        setSelectedVariantCode('ED-001');
      } else if (cat.id === 'blinds') {
        setSelectedSubCat('');
        setSelectedModelCode('QJ');
        setSelectedVariantCode('QJ-001');
      } else {
        const firstSub = cat.subCategories[0]?.name || '';
        setSelectedSubCat(firstSub);
        const firstModel = cat.models[0];
        if (firstModel) {
          setSelectedModelCode(firstModel.code);
          setSelectedVariantCode(firstModel.variants[0]?.code || `${firstModel.code}-001`);
        }
      }
    }
  };

  const handleSelectSubCategory = (subName: string) => {
    setSelectedSubCat(subName);
    const matching = currentCategory.models.filter((m) => m.subCategory === subName);
    if (matching.length > 0) {
      setSelectedModelCode(matching[0].code);
      setSelectedVariantCode(matching[0].variants[0]?.code || `${matching[0].code}-001`);
    }
  };

  // Filtered models
  const visibleModels = useMemo(() => {
    let list = currentCategory.models;
    if (selectedSubCat && currentCategory.subCategories.length > 0) {
      list = list.filter((m) => m.subCategory === selectedSubCat);
    }
    return list;
  }, [currentCategory, selectedSubCat]);

  // Active Model Object
  const currentModel = useMemo(() => {
    return (
      visibleModels.find((m) => m.code === selectedModelCode) ||
      visibleModels[0] ||
      currentCategory.models[0]
    );
  }, [visibleModels, selectedModelCode, currentCategory]);

  // Counters
  const unreadNoticesCount = useMemo(() => notices.filter((n) => !n.isRead).length, [notices]);
  const unreadTotalQuantity = useMemo(
    () => notices.filter((n) => !n.isRead).reduce((sum, n) => sum + (Number(n.quantity) || 0), 0),
    [notices]
  );
  const activeBorrowsCount = useMemo(() => borrows.filter((b) => b.status === '借用中').length, [borrows]);
  const pendingBorrowsCount = useMemo(() => borrows.filter((b) => b.status === '待審核').length, [borrows]);

  // Permissions helpers: only logged-in admin/manager has management & deletion rights
  const canEdit = !!user && (user.role === 'admin' || user.role === 'manager');
  const isAdmin = canEdit;

  const handleAdminPasswordSuccess = async () => {
    try {
      await login('paulwang8827@gmail.com', 'cfd0000');
    } catch {
      // fallback
    }
    setIsAdminPasswordModalOpen(false);
    showToast('管理者身分驗證成功，已解鎖所有編輯與刪除管理權限');
    await loadDatabaseData(false);
  };

  const handleLockToViewer = async () => {
    try {
      await logout();
    } catch {}
    showToast('已退出管理者身分，返回一般訪客模式');
  };

  // --- Actions & CRUD Integrations ---

  // Notice Handlers
  const handleToggleNoticeRead = async (id: string) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await api.markNoticeAsRead(id);
    } catch (err) {
      console.warn('Mark notice read notice:', err);
    }
  };

  const handleMarkAllNoticesAsRead = async () => {
    setNotices((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('所有新品通知已標示為已讀');
    try {
      await api.markAllNoticesAsRead();
    } catch (err) {
      console.warn('Mark all notices read notice:', err);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    showToast('已刪除該新品通知');
    try {
      await api.deleteNotice(id);
    } catch (err) {
      console.warn('Delete notice notice:', err);
    }
  };

  // Add Item Click
  const handleAddNewClick = () => {
    if (!canEdit) {
      setIsAdminPasswordModalOpen(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  // Add New Model (Product)
  const handleAddNewModel = async (
    catId: string,
    subCat: string,
    code: string,
    name: string,
    material: string,
    dimensions: string,
    variantCode: string,
    variantName: string,
    initialStock: number
  ) => {
    try {
      const targetCat = categories.find((c) => c.id === catId);
      const catName = targetCat?.name || '新品系列';
      const subCatText = subCat ? subCat.trim() : '';
      const stockQty = Number(initialStock) || 0;

      // Optimistically create new notice immediately so the notification badge on top updates right away
      const newNoticeItem: NoticeItem = {
        id: `not-${Date.now()}`,
        category: '新品到庫',
        title: `【${catName}】${code} ${name} 新品已入庫`,
        summary: `次分類：${subCatText || '通用'} ｜ 規格：${variantCode} (${variantName || '標準規格'}) ｜ 初始入庫數量：${stockQty} 件 ｜ 儲位：${code}-01`,
        modelCode: code,
        skuCode: variantCode,
        targetCategoryId: catId,
        categoryName: catName,
        quantity: stockQty,
        date: new Date().toISOString().slice(0, 10),
        isRead: false,
        tagColor: 'bg-[#e2f1e6] text-[#2c5f40]',
        createdAt: new Date().toISOString(),
      };

      setNotices((prev) => [newNoticeItem, ...prev]);

      const res = await api.createProduct({
        categoryId: catId,
        subCategory: subCat,
        productCode: code,
        productName: name,
        material,
        dimensions,
        variantCode,
        variantName,
        initialStock: stockQty,
      });

      showToast(`產品【${code} - ${name}】已成功入庫建檔！新品通知已同步更新 (+${stockQty} 件)`);
      setIsAddModalOpen(false);

      // Select newly added category and model in inventory
      setSelectedCategoryId(catId);
      if (subCatText) setSelectedSubCat(subCatText);
      setSelectedModelCode(code);
      setSelectedVariantCode(variantCode);

      // Refresh real data from Database
      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '新增產品失敗', 'error');
    }
  };

  // Edit Stock
  const handleOpenEditModal = (model: ProductModel, variant: VariantSKU) => {
    if (!canEdit) {
      showToast('權限不足：庫存修改需具備 Manager 或 Admin 權限', 'error');
      return;
    }
    setModalTargetModel(model);
    setModalTargetVariant(variant);
    setIsEditModalOpen(true);
  };

  const handleSaveStock = async (
    modelCode: string,
    variantCode: string,
    newTotal: number,
    locationBin: string,
    reason: string
  ) => {
    try {
      const res = await api.updateVariant(variantCode, {
        newTotalStock: newTotal,
        locationBin,
        reason,
      });

      showToast(res.message);
      setIsEditModalOpen(false);

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '庫存更新失敗', 'error');
    }
  };

  // Delete Variant SKU (Admin & Manager)
  const handleDeleteVariant = (model: ProductModel, variant: VariantSKU) => {
    setDeleteConfirmState({
      isOpen: true,
      title: '確認刪除規格品項',
      itemDescription: `【${model.code}】${model.name} — 規格【${variant.code}】${variant.name}`,
      warningText: `確認要將規格【${variant.code} (${variant.name})】自正式資料庫中刪除嗎？刪除後將即時同步更新。`,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteConfirmState((prev) => ({ ...prev, isDeleting: true }));
        try {
          // Optimistic local state update
          setCategories((prevCategories) => {
            return prevCategories.map((cat) => {
              const updatedModels = cat.models.map((m) => {
                if (m.code === model.code) {
                  const filteredVariants = m.variants.filter((v) => v.code !== variant.code);
                  return { ...m, variants: filteredVariants };
                }
                return m;
              });
              return { ...cat, models: updatedModels };
            });
          });

          // Switch selected variant if deleting current active variant
          if (selectedVariantCode === variant.code) {
            const remaining = model.variants.filter((v) => v.code !== variant.code);
            if (remaining.length > 0) {
              setSelectedVariantCode(remaining[0].code);
            }
          }

          const res = await api.deleteVariant(variant.code);
          showToast(res.message);
          setDeleteConfirmState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));

          await loadDatabaseData(false);
          triggerSheetsSync();
        } catch (err: any) {
          showToast(err.message || '刪除規格失敗', 'error');
          setDeleteConfirmState((prev) => ({ ...prev, isDeleting: false }));
          await loadDatabaseData(false);
        }
      },
    });
  };

  // Delete Product Model (Admin & Manager)
  const handleDeleteModel = (model: ProductModel) => {
    setDeleteConfirmState({
      isOpen: true,
      title: '確認刪除型號',
      itemDescription: `型號【${model.code}】${model.name}（包含所屬 ${model.variants.length} 項規格品項）`,
      warningText: `確認要將型號【${model.code} - ${model.name}】及其所有規格品項自正式資料庫永久刪除嗎？此動作將同步至雲端試算表。`,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteConfirmState((prev) => ({ ...prev, isDeleting: true }));
        try {
          // Optimistic local state update
          setCategories((prevCategories) => {
            return prevCategories.map((cat) => {
              const filteredModels = cat.models.filter((m) => m.code !== model.code);
              return { ...cat, models: filteredModels };
            });
          });

          // Switch selected model if deleting current active model
          if (selectedModelCode === model.code) {
            const currentCat = categories.find((c) => c.models.some((m) => m.code === model.code));
            const remaining = currentCat?.models.filter((m) => m.code !== model.code) || [];
            if (remaining.length > 0) {
              setSelectedModelCode(remaining[0].code);
              setSelectedVariantCode(remaining[0].variants[0]?.code || '');
            }
          }

          const res = await api.deleteProduct(model.id || model.code);
          showToast(res.message);
          setDeleteConfirmState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));

          await loadDatabaseData(false);
          triggerSheetsSync();
        } catch (err: any) {
          showToast(err.message || '刪除型號失敗', 'error');
          setDeleteConfirmState((prev) => ({ ...prev, isDeleting: false }));
          await loadDatabaseData(false);
        }
      },
    });
  };

  // Edit Model Specs (Admin or Manager)
  const handleOpenEditModelModal = (model: ProductModel) => {
    if (!canEdit) {
      showToast('權限不足：編輯型號規格需具備 Manager 或 Admin 權限', 'error');
      return;
    }
    setModalTargetModel(model);
    setIsEditModelModalOpen(true);
  };

  const handleSaveModel = async (
    targetId: string,
    data: {
      productName: string;
      material: string;
      dimensions: string;
      description: string;
      expectedUpdatedAt?: string;
    }
  ) => {
    try {
      const res = await api.updateProduct(targetId, data);
      showToast(res.message);
      setIsEditModelModalOpen(false);

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      throw err;
    }
  };

  // Image Upload
  const handleOpenUploadImageModal = (model: ProductModel, variant: VariantSKU) => {
    if (!canEdit) {
      showToast('權限不足：更新產品照片需具備 Manager 或 Admin 權限', 'error');
      return;
    }
    setModalTargetModel(model);
    setModalTargetVariant(variant);
    setIsUploadImageModalOpen(true);
  };

  const handleSaveProductImage = async (modelCode: string, variantCode: string, imageUrl: string) => {
    try {
      await api.updateVariant(variantCode, {
        customImage: imageUrl,
        reason: imageUrl ? '更新實拍照片' : '移除實拍照片',
      });

      showToast(imageUrl ? `已更新【${modelCode} - ${variantCode}】之產品實拍照片` : `已恢復預設圖示`);
      setIsUploadImageModalOpen(false);

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '儲存照片失敗', 'error');
    }
  };

  // Borrow Modal & Submit
  const handleOpenBorrowModal = (model?: ProductModel, variant?: VariantSKU) => {
    const m = model || currentModel;
    const v = variant || (m ? m.variants.find((x) => x.code === selectedVariantCode) || m.variants[0] : null);
    if (m && v) {
      setModalTargetModel(m);
      setModalTargetVariant(v);
      setIsBorrowModalOpen(true);
    }
  };

  const handleSubmitBorrow = async (
    categoryId: string,
    categoryName: string,
    subCategory: string,
    modelCode: string,
    modelName: string,
    skuCode: string,
    variantName: string,
    borrower: string,
    department: string,
    quantity: number,
    purpose: string,
    returnDate: string,
    notes?: string
  ) => {
    try {
      const res = await api.submitBorrow({
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
        expectedReturnDate: returnDate,
        notes,
      });

      showToast(res.message);
      setIsBorrowModalOpen(false);
      setActiveTab('borrow_status');

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '借調申請送出失敗', 'error');
    }
  };

  // Approve Borrow
  const handleApproveBorrow = async (recordId: string) => {
    if (!canEdit) {
      showToast('權限不足：審核出借需具備 Manager 或 Admin 權限', 'error');
      return;
    }

    try {
      const res = await api.updateBorrowStatus(recordId, 'approve');
      showToast(res.message);

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '核准失敗', 'error');
    }
  };

  // Reject Borrow
  const handleRejectBorrow = async (recordId: string, reason?: string) => {
    if (!canEdit) {
      showToast('權限不足：駁回申請需具備 Manager 或 Admin 權限', 'error');
      return;
    }

    try {
      const res = await api.updateBorrowStatus(recordId, 'reject', reason);
      showToast(res.message);

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '駁回失敗', 'error');
    }
  };

  // Return Item
  const handleReturnBorrowItem = async (recordId: string) => {
    try {
      const res = await api.updateBorrowStatus(recordId, 'return');
      showToast(res.message);

      await loadDatabaseData();
      triggerSheetsSync();
    } catch (err: any) {
      showToast(err.message || '歸還入庫銷案失敗', 'error');
    }
  };

  // Delete Borrow Record (Admin & Manager)
  const handleDeleteBorrow = (recordId: string) => {
    const record = borrows.find((b) => b.id === recordId);
    setDeleteConfirmState({
      isOpen: true,
      title: '確認刪除借調記錄',
      itemDescription: `借調單【${record?.id || recordId}】— 借調人：${record?.borrower || ''} (${record?.modelCode || ''} ${record?.skuCode || ''})`,
      warningText: '確定要自正式資料庫中永久刪除此筆借調紀錄嗎？',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteConfirmState((prev) => ({ ...prev, isDeleting: true }));
        try {
          setBorrows((prev) => prev.filter((b) => b.id !== recordId));
          const res = await api.deleteBorrow(recordId);
          showToast(res.message);
          setDeleteConfirmState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));

          await loadDatabaseData(false);
          triggerSheetsSync();
        } catch (err: any) {
          showToast(err.message || '刪除借調紀錄失敗', 'error');
          setDeleteConfirmState((prev) => ({ ...prev, isDeleting: false }));
          await loadDatabaseData(false);
        }
      },
    });
  };

  // Navigation handlers
  const handleNavigateToItemFromBorrow = (modelCode: string, skuCode: string) => {
    for (const cat of categories) {
      const m = cat.models.find((model) => model.code === modelCode);
      if (m) {
        setSelectedCategoryId(cat.id);
        if (m.subCategory) {
          setSelectedSubCat(m.subCategory);
        }
        setSelectedModelCode(modelCode);
        setSelectedVariantCode(skuCode);
        setActiveTab('inventory');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(`已跳轉至【${modelCode} - ${skuCode}】樣品在庫頁面`);
        return;
      }
    }
  };

  const handleNavigateFromNotice = (catId: string, modelCode: string, skuCode: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.modelCode === modelCode && n.skuCode === skuCode ? { ...n, isRead: true } : n))
    );
    setSelectedCategoryId(catId);
    setSelectedModelCode(modelCode);
    setSelectedVariantCode(skuCode);
    setActiveTab('inventory');
    showToast(`已跳轉至品項 ${skuCode}`);
  };

  return (
    <div className="min-h-screen bg-[#edf2ec] text-[#2c3e35] flex flex-col font-sans antialiased">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickRent={() => handleOpenBorrowModal()}
        onAddNew={handleAddNewClick}
        unreadNoticesCount={unreadNoticesCount}
        unreadTotalQuantity={unreadTotalQuantity}
        activeBorrowsCount={activeBorrowsCount}
        pendingBorrowsCount={pendingBorrowsCount}
        currentRole={user?.role || 'user'}
        currentUserName={user?.name}
        onOpenPermissionModal={() => setIsAuditLogsModalOpen(true)}
        onOpenAdminPasswordModal={() => setIsAdminPasswordModalOpen(true)}
        onLockToViewer={handleLockToViewer}
        onOpenAuditLogsModal={() => setIsAuditLogsModalOpen(true)}
        onLogout={handleLockToViewer}
        isSheetsConnected={isSheetsConnected}
        isSheetsSyncing={isSheetsSyncing}
        onConnectGoogleSheets={handleConnectGoogleSheets}
        sheetsSpreadsheetUrl={sheetsSpreadsheetUrl}
        onShare={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1560px] mx-auto px-3 sm:px-6 md:px-8 pb-10 pt-2 sm:pt-3">
        {dataError && (
          <div className="mb-4 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-medium">{dataError}（目前使用快照展示模式，系統仍可正常瀏覽）</span>
            </div>
            <button
              onClick={() => loadDatabaseData(false)}
              className="px-3 py-1 rounded-lg bg-[#547a6b] text-white text-xs font-semibold hover:bg-[#436456] cursor-pointer transition-colors shrink-0"
            >
              重新整理連線
            </button>
          </div>
        )}

        {activeTab === 'inventory' ? (
          <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-5 md:gap-7 w-full">
            <Sidebar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />

            <div className="flex-1 w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-9 shadow-xs border border-[#e2e9e1]">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#7da8a3] tracking-tight whitespace-nowrap">
                  {currentCategory.name}
                </h2>

                {currentCategory.subCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {currentCategory.subCategories.map((sub) => {
                      const isActive = sub.name === selectedSubCat;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSubCategory(sub.name)}
                          className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[#eff3ee] text-[#334a41] shadow-2xs font-semibold'
                              : 'bg-transparent text-[#5c7268]/70 hover:bg-[#eff3ee]/60 hover:text-[#334a41]'
                          }`}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-6 w-full">
                <ProductModelList
                  models={visibleModels}
                  selectedModelCode={selectedModelCode}
                  onSelectModel={(code) => {
                    setSelectedModelCode(code);
                    const m = visibleModels.find((x) => x.code === code);
                    if (m && m.variants.length > 0) {
                      setSelectedVariantCode(m.variants[0].code);
                    }
                  }}
                  subCategoryTitle={selectedSubCat || currentCategory.name}
                  showTitle={true}
                />

                {currentModel ? (
                  <VariantDetailPanel
                    model={currentModel}
                    selectedVariantCode={selectedVariantCode}
                    onSelectVariant={setSelectedVariantCode}
                    onQuickBorrow={(m, v) => handleOpenBorrowModal(m, v)}
                    onEditStock={(m, v) => handleOpenEditModal(m, v)}
                    onViewDoc={(m, v) => {
                      setModalTargetModel(m);
                      setModalTargetVariant(v);
                      setIsDocModalOpen(true);
                    }}
                    onBack={() => {
                      handleSelectCategory('no_tool');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    isAdmin={isAdmin}
                    onEditImage={canEdit ? handleOpenUploadImageModal : undefined}
                    onDeleteVariant={canEdit ? handleDeleteVariant : undefined}
                    onEditModel={canEdit ? handleOpenEditModelModal : undefined}
                    onDeleteModel={canEdit ? handleDeleteModel : undefined}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-12 bg-[#eff3ee] rounded-2xl text-[#7c9487] text-sm">
                    此分類下無相應型號
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'new_notices' ? (
          <NewNoticesView
            notices={notices}
            onNavigateToItem={handleNavigateFromNotice}
            onToggleRead={handleToggleNoticeRead}
            onMarkAllAsRead={handleMarkAllNoticesAsRead}
            onDeleteNotice={handleDeleteNotice}
            onAddNew={handleAddNewClick}
            isAdmin={canEdit}
          />
        ) : activeTab === 'borrow_status' ? (
          <BorrowStatusView
            borrows={borrows}
            onApproveBorrow={handleApproveBorrow}
            onRejectBorrow={handleRejectBorrow}
            onReturnItem={handleReturnBorrowItem}
            onNavigateToItem={handleNavigateToItemFromBorrow}
            onOpenBorrowModal={() => handleOpenBorrowModal()}
            onDeleteBorrow={handleDeleteBorrow}
            isAdmin={canEdit}
            onOpenAdminLogin={() => setIsAdminPasswordModalOpen(true)}
          />
        ) : (
          <AdminLoginPage
            onSuccess={async () => {
              try {
                await login('paulwang8827@gmail.com', 'cfd0000');
              } catch {}
              setActiveTab('inventory');
              showToast('已成功切換至管理模式');
              await loadDatabaseData(false);
            }}
            onCancel={() => setActiveTab('inventory')}
            isSheetsConnected={isSheetsConnected}
            onConnectGoogleSheets={handleConnectGoogleSheets}
            isSheetsSyncing={isSheetsSyncing}
          />
        )}
      </main>

      {/* Global Toast */}
      {globalToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            globalToast.type === 'error'
              ? 'bg-[#c0392b] text-white border-red-700'
              : 'bg-[#2d4237] text-white border-[#3e564a]'
          }`}
        >
          {globalToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{globalToast.message}</span>
        </div>
      )}

      {/* Real Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onAddNewModel={handleAddNewModel}
      />

      <BorrowModal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        model={modalTargetModel}
        variant={modalTargetVariant}
        categories={categories}
        onSubmitBorrow={handleSubmitBorrow}
      />

      <DocCardModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        model={modalTargetModel}
        variant={modalTargetVariant}
        borrows={borrows}
      />

      <EditStockModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        model={modalTargetModel}
        variant={modalTargetVariant}
        onSaveStock={handleSaveStock}
      />

      <EditModelModal
        isOpen={isEditModelModalOpen}
        onClose={() => setIsEditModelModalOpen(false)}
        model={modalTargetModel}
        onSaveModel={handleSaveModel}
      />

      <UploadImageModal
        isOpen={isUploadImageModalOpen}
        onClose={() => setIsUploadImageModalOpen(false)}
        model={modalTargetModel}
        variant={modalTargetVariant}
        onSaveImage={handleSaveProductImage}
      />

      <AdminAuditLogsModal
        isOpen={isAuditLogsModalOpen}
        onClose={() => setIsAuditLogsModalOpen(false)}
      />

      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={handleAdminPasswordSuccess}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onToast={showToast}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirmState.isOpen}
        title={deleteConfirmState.title}
        itemDescription={deleteConfirmState.itemDescription}
        warningText={deleteConfirmState.warningText}
        isDeleting={deleteConfirmState.isDeleting}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InventoryManagementApp />
    </AuthProvider>
  );
}
