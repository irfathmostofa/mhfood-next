"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Tags,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const EMPTY_PRODUCT = {
  name: "",
  slug: "",
  category_id: "",
  price: "",
  stock: 0,
  description: "",
  is_featured: false,
  is_active: true,
};

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null); // product being edited
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: productsData }, { data: categoryData }, { data: heroData }] =
      await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("hero_slides").select("*").order("sort_order"),
      ]);
    setProducts(productsData || []);
    setCategories(categoryData || []);
    setHeroSlides(heroData || []);
    setLoading(false);
  }

  function showFlash(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  }

  // ---- Products ----
  async function saveProduct(e) {
    e.preventDefault();
    if (!editing?.name) return;
    setSaving(true);
    setError("");

    const payload = {
      name: editing.name,
      slug:
        editing.slug ||
        slugify(editing.name) +
          (editing.id ? "" : `-${Date.now().toString(36).slice(-4)}`),
      category_id: editing.category_id || null,
      price: Number(editing.price) || 0,
      stock: Number(editing.stock) || 0,
      description: editing.description || "",
      is_featured: editing.is_featured,
      is_active: editing.is_active,
    };

    const { data: savedProduct, error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("products").insert(payload).select().single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    // Save variants if any were edited.
    const variantRows = editing.variants || [];
    if (variantRows.some((v) => v._dirty)) {
      const existing = variantRows.filter((v) => v.id && !v._removed);
      const removedIds = variantRows.filter((v) => v._removed && v.id).map((v) => v.id);
      const newRows = variantRows
        .filter((v) => !v.id && !v._removed && (v.name || v.value))
        .map(({ name, value, price_adjustment, stock, sku }) => ({
          product_id: savedProduct.id,
          name,
          value,
          price_adjustment: Number(price_adjustment) || 0,
          stock: Number(stock) || 0,
          sku: sku || null,
        }));

      if (removedIds.length > 0) {
        await supabase.from("product_variants").delete().in("id", removedIds);
      }
      if (existing.length > 0) {
        await Promise.all(
          existing.map((v) =>
            supabase
              .from("product_variants")
              .update({
                name: v.name,
                value: v.value,
                price_adjustment: Number(v.price_adjustment) || 0,
                stock: Number(v.stock) || 0,
                sku: v.sku || null,
              })
              .eq("id", v.id),
          ),
        );
      }
      if (newRows.length > 0) {
        await supabase.from("product_variants").insert(newRows);
      }
    }

    setEditing(null);
    showFlash(editing.id ? "Product updated." : "Product added.");
    await loadAll();
    setSaving(false);
  }

  async function loadVariants(productId) {
    if (!productId) return [];
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    return data || [];
  }

  async function toggleActive(product) {
    await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);
    await loadAll();
  }

  // ---- Categories ----
  async function saveCategory(e) {
    e.preventDefault();
    if (!editingCategory?.name) return;
    setSaving(true);
    const payload = {
      name: editingCategory.name,
      slug: editingCategory.slug || slugify(editingCategory.name),
      image_url: editingCategory.image_url || null,
    };
    const { error } = editingCategory.id
      ? await supabase.from("categories").update(payload).eq("id", editingCategory.id)
      : await supabase.from("categories").insert(payload);
    if (error) setError(error.message);
    else {
      setEditingCategory(null);
      showFlash(editingCategory.id ? "Category updated." : "Category added.");
      await loadAll();
    }
    setSaving(false);
  }

  async function deleteCategory(id) {
    if (!confirm("Delete this category? Products in it will keep their data.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) setError(error.message);
    else {
      showFlash("Category deleted.");
      await loadAll();
    }
  }

  // ---- Hero slides ----
  async function addHeroSlide() {
    const { data, error } = await supabase
      .from("hero_slides")
      .insert({
        image_url: "",
        title: "New Slide",
        subtitle: "",
        link_url: "",
        sort_order: heroSlides.length + 1,
        is_active: true,
      })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setHeroSlides((prev) => [...prev, data]);
    showFlash("Slide added — fill in the details below.");
  }

  async function saveHeroSlide(slide) {
    setSaving(true);
    const { error } = await supabase
      .from("hero_slides")
      .update({
        image_url: slide.image_url,
        title: slide.title,
        subtitle: slide.subtitle,
        link_url: slide.link_url,
        sort_order: slide.sort_order,
        is_active: slide.is_active,
      })
      .eq("id", slide.id);
    if (error) setError(error.message);
    else showFlash("Slide saved.");
    setSaving(false);
  }

  async function deleteHeroSlide(id) {
    if (!confirm("Delete this hero slide?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) setError(error.message);
    else {
      showFlash("Slide deleted.");
      await loadAll();
    }
  }

  function updateHeroSlide(id, field, value) {
    setHeroSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-ink">Products</h1>
        <button
          onClick={() =>
            setEditing({
              ...EMPTY_PRODUCT,
              slug: "",
              id: null,
              variants: [],
            })
          }
          className="btn btn-primary"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {flash && (
        <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          {flash}
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Product list */}
        <div className="xl:col-span-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input mb-4"
          />

          {loading ? (
            <p className="text-sm text-muted py-10 text-center">Loading products...</p>
          ) : (
            <div className="card overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted py-10 text-center">
                  No products found.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {filtered.map((product) => (
                    <li key={product.id} className="flex items-center justify-between px-5 py-4">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-ink truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          ৳{product.price} · {product.stock} in stock ·{" "}
                          {product.is_featured ? "featured" : "not featured"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            product.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-muted border border-line"
                          }`}
                        >
                          {product.is_active ? "Active" : "Hidden"}
                        </button>
                        <button
                          onClick={async () => {
                            const variants = await loadVariants(product.id);
                            setEditing({ ...product, variants });
                          }}
                          aria-label="Edit"
                          className="p-2 text-muted hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Product form */}
        <div className="xl:col-span-2">
          {editing ? (
            <form onSubmit={saveProduct} className="card p-6 space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">
                  {editing.id ? "Edit Product" : "New Product"}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  aria-label="Close"
                  className="text-muted hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="label">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Slug (URL)</label>
                <input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="auto-generated from name"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={editing.category_id || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, category_id: e.target.value })
                  }
                  className="input"
                >
                  <option value="">— No category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editing.price}
                    onChange={(e) =>
                      setEditing({ ...editing, price: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.stock}
                    onChange={(e) =>
                      setEditing({ ...editing, stock: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={editing.is_featured}
                    onChange={(e) =>
                      setEditing({ ...editing, is_featured: e.target.checked })
                    }
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) =>
                      setEditing({ ...editing, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>

              <VariantsEditor
                variants={editing.variants || []}
                onChange={(variants) =>
                  setEditing({ ...editing, variants })
                }
              />

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary w-full disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> {editing.id ? "Save Changes" : "Add Product"}
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <HeroSlidesManager
                slides={heroSlides}
                saving={saving}
                onAdd={addHeroSlide}
                onUpdate={updateHeroSlide}
                onSave={saveHeroSlide}
                onDelete={deleteHeroSlide}
              />
              <CategoriesManager
                categories={categories}
                editingCategory={editingCategory}
                setEditingCategory={setEditingCategory}
                saving={saving}
                onSave={saveCategory}
                onDelete={deleteCategory}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Variants ----------
// Variant rows follow the group/value pattern: name = group (Size),
// value = option (Large). A product can have multiple groups.
function VariantsEditor({ variants, onChange }) {
  const [open, setOpen] = useState(false);

  function update(idx, field, value) {
    onChange(
      variants.map((v, i) =>
        i === idx ? { ...v, [field]: value, _dirty: true } : v,
      ),
    );
  }

  function addRow() {
    onChange([
      ...variants,
      {
        id: null,
        name: "",
        value: "",
        price_adjustment: 0,
        stock: 0,
        sku: "",
        _dirty: true,
        _removed: false,
      },
    ]);
  }

  function removeRow(idx) {
    onChange(
      variants.map((v, i) =>
        i === idx ? { ...v, _removed: true, _dirty: true } : v,
      ),
    );
  }

  const visible = variants.filter((v) => !v._removed);

  return (
    <div className="border border-line rounded-xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-ink"
      >
        <span>Options / Variants</span>
        <span className="flex items-center gap-2">
          {visible.length > 0 && (
            <span className="text-xs text-muted font-normal">
              {visible.length} set
            </span>
          )}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-xs text-muted mb-3">
            Groups are options like Size or Color. Each row is one option; the
            first column is the group name, the second is the option value.
            Fill both to create a variant.
          </p>

          {visible.length === 0 && (
            <p className="text-xs text-muted mb-3">
              No variants — this product is sold as-is.
            </p>
          )}

          <div className="space-y-2">
            {variants.map((v, i) =>
              v._removed ? null : (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    value={v.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    placeholder="Group"
                    className="input input-sm"
                  />
                  <input
                    value={v.value}
                    onChange={(e) => update(i, "value", e.target.value)}
                    placeholder="Value"
                    className="input input-sm"
                  />
                  <input
                    type="number"
                    value={v.price_adjustment}
                    onChange={(e) => update(i, "price_adjustment", e.target.value)}
                    placeholder="+৳"
                    className="input input-sm"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => update(i, "stock", e.target.value)}
                    placeholder="Stock"
                    className="input input-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Remove variant"
                    className="justify-self-end p-1.5 text-muted hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 btn btn-outline btn-sm"
          >
            <Plus size={14} /> Add Option
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Hero slides ----------
function HeroSlidesManager({ slides, saving, onAdd, onUpdate, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">Hero Slider</h2>
        <button onClick={onAdd} className="btn btn-outline btn-sm">
          <Plus size={14} /> Add Slide
        </button>
      </div>
      <p className="text-xs text-muted mb-4">
        Slides shown at the top of the homepage.
      </p>

      <div className="space-y-4">
        {slides.map((slide) => (
          <div key={slide.id} className="border border-line rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={slide.is_active}
                  onChange={(e) => onUpdate(slide.id, "is_active", e.target.checked)}
                />
                Active
              </label>
              <button
                onClick={() => onDelete(slide.id)}
                aria-label="Delete slide"
                className="text-muted hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div>
              <label className="label">Image URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={slide.image_url}
                    onChange={(e) => onUpdate(slide.id, "image_url", e.target.value)}
                    placeholder="https://..."
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Title</label>
                <input
                  value={slide.title}
                  onChange={(e) => onUpdate(slide.id, "title", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Link URL</label>
                <input
                  value={slide.link_url}
                  onChange={(e) => onUpdate(slide.id, "link_url", e.target.value)}
                  placeholder="/shop"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Subtitle</label>
              <input
                value={slide.subtitle}
                onChange={(e) => onUpdate(slide.id, "subtitle", e.target.value)}
                className="input"
              />
            </div>

            <button
              onClick={() => onSave(slide)}
              disabled={saving}
              className="btn btn-outline w-full btn-sm disabled:opacity-60"
            >
              <Save size={14} /> Save Slide
            </button>
          </div>
        ))}

        {slides.length === 0 && (
          <p className="text-xs text-muted text-center py-4">
            No slides yet — click &quot;Add Slide&quot; to create one.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- Categories ----------
function CategoriesManager({
  categories,
  editingCategory,
  setEditingCategory,
  saving,
  onSave,
  onDelete,
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-ink"
      >
        <span className="flex items-center gap-2">
          <Tags size={15} /> Categories
        </span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4">
          <form onSubmit={onSave} className="grid grid-cols-1 gap-2 mb-4">
            <input
              value={editingCategory?.name || ""}
              onChange={(e) =>
                setEditingCategory({
                  ...(editingCategory || { id: null, slug: "", image_url: "" }),
                  name: e.target.value,
                })
              }
              placeholder="Category name"
              className="input"
              required
            />
            <input
              value={editingCategory?.image_url || ""}
              onChange={(e) =>
                setEditingCategory({
                  ...(editingCategory || { id: null, name: "", slug: "" }),
                  image_url: e.target.value,
                })
              }
              placeholder="Image URL (optional)"
              className="input"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-outline btn-sm flex-1 disabled:opacity-60"
              >
                {editingCategory?.id ? "Save Category" : "Add Category"}
              </button>
              {editingCategory?.id && (
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <ul className="divide-y divide-line">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-ink">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditingCategory({
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        image_url: cat.image_url || "",
                      })
                    }
                    aria-label="Edit category"
                    className="text-muted hover:text-ink"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(cat.id)}
                    aria-label="Delete category"
                    className="text-muted hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
