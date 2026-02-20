"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Plus, Edit3, Trash2, Package, Filter,
    Grid2X2, List, X, Loader2, AlertCircle, Tag,
    ImagePlus, Upload,
} from "lucide-react";
import { productAPI, categoryAPI, inventoryAPI, outletAPI } from "@/lib/api";
import { Product, Category, InventoryItem, Outlet } from "@/types";

type Tab = "products" | "categories";

// Helper: resolve image URL — use directly if absolute (Cloudinary), prepend API base if relative
const resolveImageUrl = (url?: string): string => {
    if (!url) return "";
    if (url.startsWith("http")) return url; // Already absolute (Cloudinary)
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';
    return `${base}${url}`;
};

export default function ProductsPage() {
    const [tab, setTab] = useState<Tab>("products");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stockMap, setStockMap] = useState<Record<string, number>>({});
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<string>("");

    // Product modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Category modal state
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [savingCat, setSavingCat] = useState(false);
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);
    const [catForm, setCatForm] = useState({ name: "", slug: "", icon: "" });

    // Product form state
    const [form, setForm] = useState({
        name: "",
        sku: "",
        barcode: "",
        description: "",
        base_price: 0,
        cost_price: 0,
        tax_rate: 11,
        category_id: "",
        is_active: true,
        track_stock: true,
        image_url: "",
    });
    const [imagePreview, setImagePreview] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Compress image to WebP at 50% quality
    const compressToWebP = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                // Max 800px for product images
                const maxSize = 800;
                let w = img.width;
                let h = img.height;
                if (w > maxSize || h > maxSize) {
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else { w = Math.round(w * maxSize / h); h = maxSize; }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("Canvas not supported")); return; }
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error("Compression failed")); return; }
                        const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                            type: "image/webp",
                        });
                        resolve(webpFile);
                    },
                    "image/webp",
                    0.5 // 50% quality
                );
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressToWebP(file);
            setImageFile(compressed);
            setImagePreview(URL.createObjectURL(compressed));
        } catch {
            setError("Gagal memproses gambar");
        }
    };

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await productAPI.getAll(search || undefined, filterCategory || undefined);
            setProducts(res.data.data || []);
        } catch {
            setError("Gagal memuat produk");
        } finally {
            setLoading(false);
        }
    }, [search, filterCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(res.data.data || []);
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        // Load outlets for stock data
        outletAPI.getAll().then(res => {
            const data = res.data.data || [];
            setOutlets(data);
            if (data.length > 0) setSelectedOutlet(data[0].id);
        }).catch(() => { });
    }, [fetchProducts, fetchCategories]);

    // Fetch stock data when outlet changes
    useEffect(() => {
        if (!selectedOutlet) return;
        inventoryAPI.getStock(selectedOutlet).then(res => {
            const map: Record<string, number> = {};
            (res.data.data || []).forEach((inv: InventoryItem) => {
                map[inv.product_id] = inv.quantity;
            });
            setStockMap(map);
        }).catch(() => { });
    }, [selectedOutlet, products]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 400);
        return () => clearTimeout(timer);
    }, [search, fetchProducts]);

    // ==================== PRODUCT HANDLERS ====================
    const resetForm = () => {
        setForm({
            name: "", sku: "", barcode: "", description: "",
            base_price: 0, cost_price: 0, tax_rate: 11,
            category_id: "", is_active: true, track_stock: true,
            image_url: "",
        });
        setEditingProduct(null);
        setImagePreview("");
        setImageFile(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            sku: product.sku || "",
            barcode: product.barcode || "",
            description: product.description || "",
            base_price: product.base_price,
            cost_price: product.cost_price,
            tax_rate: product.tax_rate,
            category_id: product.category_id || "",
            is_active: product.is_active,
            track_stock: product.track_stock,
            image_url: product.image_url || "",
        });
        setImagePreview(resolveImageUrl(product.image_url));
        setImageFile(null);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            let imageUrl = form.image_url;

            // Upload image if new file selected
            if (imageFile) {
                const uploadRes = await productAPI.uploadImage(imageFile);
                imageUrl = uploadRes.data.data?.image_url || imageUrl;
            }

            const payload = {
                ...form,
                image_url: imageUrl,
                category_id: form.category_id || undefined,
            };

            if (editingProduct) {
                await productAPI.update(editingProduct.id, payload);
            } else {
                await productAPI.create(payload);
            }
            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch {
            setError(editingProduct ? "Gagal mengupdate produk" : "Gagal membuat produk");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await productAPI.delete(id);
            setDeleteConfirm(null);
            fetchProducts();
        } catch {
            setError("Gagal menghapus produk");
        }
    };

    const getStatusBadge = (product: Product) => {
        if (!product.is_active) return { label: "Nonaktif", class: "badge-danger" };
        return { label: "Aktif", class: "badge-success" };
    };

    // ==================== CATEGORY HANDLERS ====================
    const resetCatForm = () => {
        setCatForm({ name: "", slug: "", icon: "" });
        setEditingCategory(null);
    };

    const openCreateCatModal = () => {
        resetCatForm();
        setShowCatModal(true);
    };

    const openEditCatModal = (cat: Category) => {
        setEditingCategory(cat);
        setCatForm({ name: cat.name, slug: cat.slug || "", icon: cat.icon || "" });
        setShowCatModal(true);
    };

    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCat(true);
        setError("");
        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory.id, catForm);
            } else {
                await categoryAPI.create(catForm);
            }
            setShowCatModal(false);
            resetCatForm();
            fetchCategories();
        } catch {
            setError(editingCategory ? "Gagal mengupdate kategori" : "Gagal membuat kategori");
        } finally {
            setSavingCat(false);
        }
    };

    const handleDeleteCat = async (id: string) => {
        try {
            await categoryAPI.delete(id);
            setDeleteCatConfirm(null);
            fetchCategories();
        } catch {
            setError("Gagal menghapus kategori");
        }
    };

    // ==================== RENDER ====================
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Produk & Kategori</h1>
                    <p className="text-sm text-white/40 mt-1">
                        Kelola katalog produk dan kategori Anda
                    </p>
                </div>
                <button
                    onClick={tab === "products" ? openCreateModal : openCreateCatModal}
                    className="btn-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    {tab === "products" ? "Tambah Produk" : "Tambah Kategori"}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit animate-fade-in">
                <button
                    onClick={() => setTab("products")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "products" ? "bg-gradient-to-r from-[#C40000]/20 to-[#C40000]/5 text-white border border-[#C40000]/20" : "text-white/40 hover:text-white"}`}
                >
                    <Package className="w-4 h-4" /> Produk ({products.length})
                </button>
                <button
                    onClick={() => setTab("categories")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "categories" ? "bg-gradient-to-r from-[#C40000]/20 to-[#C40000]/5 text-white border border-[#C40000]/20" : "text-white/40 hover:text-white"}`}
                >
                    <Tag className="w-4 h-4" /> Kategori ({categories.length})
                </button>
            </div>

            {/* ==================== PRODUCTS TAB ==================== */}
            {tab === "products" && (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                className="input-glass pl-11"
                                placeholder="Cari produk atau SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="input-glass text-sm min-w-[160px]"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</option>
                                ))}
                            </select>
                            <div className="flex gap-0.5 p-1 rounded-xl bg-white/5">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30"}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30"}`}
                                >
                                    <Grid2X2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="glass p-12 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                            <p className="text-sm text-white/40 mt-3">Memuat produk...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="glass p-12 flex flex-col items-center justify-center">
                            <Package className="w-12 h-12 text-white/10 mb-3" />
                            <p className="text-white/40">Belum ada produk</p>
                            <button onClick={openCreateModal} className="btn-primary mt-4 text-sm">
                                <Plus className="w-4 h-4 inline mr-1" /> Tambah Produk Pertama
                            </button>
                        </div>
                    ) : viewMode === "list" ? (
                        /* Product Table */
                        <div className="glass p-0 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="overflow-x-auto">
                                <table className="table-glass">
                                    <thead>
                                        <tr>
                                            <th>Produk</th>
                                            <th className="mobile-hide">SKU</th>
                                            <th className="mobile-hide">Kategori</th>
                                            <th>Harga</th>
                                            <th className="mobile-hide">Biaya</th>
                                            <th className="text-right mobile-hide">Stok</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => {
                                            const status = getStatusBadge(product);
                                            return (
                                                <tr key={product.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                {product.image_url ? (
                                                                    <img src={resolveImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-5 h-5 text-white/20" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-medium text-white text-sm">{product.name}</span>
                                                                {product.description && (
                                                                    <p className="text-xs text-white/30 truncate max-w-[150px] sm:max-w-[200px]">{product.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="font-mono text-white/50 text-sm mobile-hide">{product.sku || "—"}</td>
                                                    <td className="mobile-hide">
                                                        {product.category ? (
                                                            <span className="badge badge-info">{product.category.name}</span>
                                                        ) : (
                                                            <span className="text-white/20 text-sm">—</span>
                                                        )}
                                                    </td>
                                                    <td className="font-medium text-white text-sm">{formatCurrency(product.base_price)}</td>
                                                    <td className="text-white/40 mobile-hide">{formatCurrency(product.cost_price)}</td>
                                                    <td className="text-right mobile-hide">
                                                        {product.track_stock ? (
                                                            <span className={`text-sm font-bold ${(stockMap[product.id] ?? 0) <= 0 ? "text-red-400" : "text-white"}`}>
                                                                {(stockMap[product.id] ?? 0).toLocaleString("id-ID")}
                                                            </span>
                                                        ) : (
                                                            <span className="text-white/20 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                                                    <td>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => openEditModal(product)} className="btn-ghost p-2">
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(product.id)}
                                                                className="btn-ghost p-2 hover:text-red-400"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                            {products.map((product) => {
                                const status = getStatusBadge(product);
                                return (
                                    <div key={product.id} className="glass p-4 hover:bg-white/5 transition-all group">
                                        <div className="w-full h-24 rounded-xl bg-white/5 flex items-center justify-center mb-3 overflow-hidden">
                                            {product.image_url ? (
                                                <img src={resolveImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-8 h-8 text-white/10" />
                                            )}
                                        </div>
                                        <h3 className="font-medium text-white text-sm truncate">{product.name}</h3>
                                        <p className="text-xs text-white/30 mt-0.5">{product.sku || "No SKU"}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-sm font-semibold text-white">{formatCurrency(product.base_price)}</span>
                                            {product.track_stock && (
                                                <span className={`text-xs font-bold ${(stockMap[product.id] ?? 0) <= 0 ? "text-red-400" : "text-white/50"}`}>
                                                    Stok: {(stockMap[product.id] ?? 0).toLocaleString("id-ID")}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`badge text-[10px] ${status.class}`}>{status.label}</span>
                                        </div>
                                        <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(product)} className="btn-ghost p-2 flex-1 text-xs">
                                                <Edit3 className="w-3 h-3 inline mr-1" /> Edit
                                            </button>
                                            <button onClick={() => setDeleteConfirm(product.id)} className="btn-ghost p-2 flex-1 text-xs hover:text-red-400">
                                                <Trash2 className="w-3 h-3 inline mr-1" /> Hapus
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ==================== CATEGORIES TAB ==================== */}
            {tab === "categories" && (
                <div className="space-y-4 animate-fade-in">
                    {categories.length === 0 ? (
                        <div className="glass p-12 flex flex-col items-center justify-center">
                            <Tag className="w-12 h-12 text-white/10 mb-3" />
                            <p className="text-white/40">Belum ada kategori</p>
                            <button onClick={openCreateCatModal} className="btn-primary mt-4 text-sm">
                                <Plus className="w-4 h-4 inline mr-1" /> Tambah Kategori Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((cat, i) => (
                                <div key={cat.id} className={`glass p-5 animate-slide-in-up stagger-${i + 1}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C40000]/20 to-[#C40000]/5 flex items-center justify-center text-2xl">
                                                {cat.icon || "📁"}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{cat.name}</h3>
                                                {cat.slug && <p className="text-xs text-white/30 font-mono">{cat.slug}</p>}
                                                <p className="text-xs text-white/40 mt-1">
                                                    {products.filter(p => p.category_id === cat.id).length} produk
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEditCatModal(cat)} className="btn-ghost p-2">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteCatConfirm(cat.id)} className="btn-ghost p-2 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== DELETE PRODUCT CONFIRM ==================== */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="glass-strong p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-2">Hapus Produk?</h3>
                        <p className="text-sm text-white/50 mb-6">Produk yang dihapus tidak dapat dikembalikan.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="btn-primary flex-1 !bg-red-600">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CATEGORY CONFIRM ==================== */}
            {deleteCatConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteCatConfirm(null)}>
                    <div className="glass-strong p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-2">Hapus Kategori?</h3>
                        <p className="text-sm text-white/50 mb-6">Kategori yang dihapus tidak dapat dikembalikan. Produk dalam kategori ini tidak akan terhapus.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteCatConfirm(null)} className="btn-secondary flex-1">Batal</button>
                            <button onClick={() => handleDeleteCat(deleteCatConfirm)} className="btn-primary flex-1 !bg-red-600">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PRODUCT MODAL ==================== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="glass-strong p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Gambar Produk</label>
                                <label className="relative flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-white/10 bg-white/3 hover:bg-white/5 hover:border-white/20 transition cursor-pointer overflow-hidden">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                                <Upload className="w-6 h-6 text-white" />
                                                <span className="text-xs text-white ml-2">Ganti Gambar</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImagePlus className="w-8 h-8 text-white/20 mb-2" />
                                            <span className="text-xs text-white/30">Klik untuk upload gambar</span>
                                            <span className="text-[10px] text-white/20 mt-1">Auto WebP 50%</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nama Produk *</label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder="Nama produk"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">SKU</label>
                                    <input type="text" className="input-glass" placeholder="NGS-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Barcode</label>
                                    <input type="text" className="input-glass" placeholder="8990001234" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Kategori</label>
                                <select className="input-glass" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                    <option value="">Tanpa Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Deskripsi</label>
                                <textarea className="input-glass" rows={2} placeholder="Deskripsi singkat produk" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Harga Jual *</label>
                                    <input type="number" className="input-glass" placeholder="25000" value={form.base_price || ""} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} required min={0} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Harga Modal</label>
                                    <input type="number" className="input-glass" placeholder="12000" value={form.cost_price || ""} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} min={0} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Pajak (%)</label>
                                    <input type="number" className="input-glass" placeholder="11" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} min={0} />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded accent-[#C40000]" />
                                    <span className="text-sm text-white/60">Aktif</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.track_stock} onChange={(e) => setForm({ ...form, track_stock: e.target.checked })} className="w-4 h-4 rounded accent-[#C40000]" />
                                    <span className="text-sm text-white/60">Lacak Stok</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== CATEGORY MODAL ==================== */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
                    <div className="glass-strong p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
                            </h2>
                            <button onClick={() => setShowCatModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSaveCat} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nama Kategori *</label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder="contoh: Makanan"
                                    value={catForm.name}
                                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Slug</label>
                                    <input
                                        type="text"
                                        className="input-glass"
                                        placeholder="makanan"
                                        value={catForm.slug}
                                        onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Ikon (Emoji)</label>
                                    <input
                                        type="text"
                                        className="input-glass"
                                        placeholder="🍛"
                                        value={catForm.icon}
                                        onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary flex-1">Batal</button>
                                <button type="submit" disabled={savingCat} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingCategory ? "Simpan" : "Tambah Kategori"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
