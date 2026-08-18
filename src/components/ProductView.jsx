"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { trackViewContent, trackAddToCart } from "@/components/Analytics";
import StarRating from "./StarRating";
import ReviewsList from "./ReviewsList";

export default function ProductView({ product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    trackViewContent({
      content_type: "product",
      content_ids: [product.id],
      content_name: product.name,
      value: Number(product.price),
      currency: "BDT",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const images = product.product_images || [];

  // Group variant rows into selectable groups
  const groups = useMemo(() => {
    const map = {};
    const variants = product.variants || [];
    variants.forEach((v) => {
      if (!map[v.name]) map[v.name] = [];
      map[v.name].push(v);
    });
    return Object.entries(map).map(([name, options]) => ({
      name,
      options: options.sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [product.variants]);

  const allSelected =
    groups.length === 0 ||
    groups.every((g) => selected[g.name]);

  const selectedOptions = groups
    .map((g) => groups && selected[g.name] && g.options.find((o) => o.id === selected[g.name]))
    .filter(Boolean);

  const priceAdjustment = selectedOptions.reduce(
    (sum, o) => sum + Number(o.price_adjustment || 0),
    0,
  );
  const price = Number(product.price) + priceAdjustment;

  const variantStock = allSelected
    ? selectedOptions.reduce((min, o) => Math.min(min, Number(o.stock)), Infinity)
    : Infinity;
  const effectiveStock =
    groups.length === 0
      ? Number(product.stock)
      : allSelected
        ? variantStock === Infinity
          ? Number(product.stock)
          : variantStock
        : Number(product.stock);

  const outOfStock = effectiveStock <= 0;

  function selectVariant(groupName, optionId) {
    setSelected((prev) => ({ ...prev, [groupName]: optionId }));
  }

  function handleAddToCart() {
    if (outOfStock || !allSelected) return;
    const selection = groups.map((g) => {
      const opt = g.options.find((o) => o.id === selected[g.name]);
      return {
        variant_id: opt.id,
        name: g.name,
        value: opt.value,
        price_adjustment: opt.price_adjustment,
      };
    });
    addItem(product, quantity, selection);
    trackAddToCart({
      content_type: "product",
      content_ids: [product.id],
      content_name: product.name,
      value: Number(product.price) + selection.reduce((s, o) => s + Number(o.price_adjustment || 0), 0),
      currency: "BDT",
      quantity,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  }

  function handleBuyNow() {
    if (outOfStock || !allSelected) return;
    const selection = groups.map((g) => {
      const opt = g.options.find((o) => o.id === selected[g.name]);
      return {
        variant_id: opt.id,
        name: g.name,
        value: opt.value,
        price_adjustment: opt.price_adjustment,
      };
    });
    addItem(product, quantity, selection);
    router.push("/checkout");
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-primary/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeImage]?.image_url || "https://placehold.co/600x600?text=No+Image"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-accent" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.categories?.name && (
            <p className="text-xs uppercase tracking-wide text-muted mb-2">
              {product.categories.name}
            </p>
          )}
          <h1 className="font-display text-2xl sm:text-3xl text-ink mb-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.avg_rating} />
            <span className="text-sm text-muted">
              {product.review_count} review{product.review_count === 1 ? "" : "s"}
            </span>
            {product.total_sold > 0 && (
              <span className="text-sm text-muted">
                · {product.total_sold} sold
              </span>
            )}
          </div>

          <p className="text-2xl font-semibold text-accent mb-4">
            ৳{price.toFixed(2)}
          </p>

          {product.description && (
            <p className="text-sm text-muted leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          {/* Variant groups */}
          {groups.length > 0 && (
            <div className="space-y-4 mb-6">
              {groups.map((g) => (
                <div key={g.name}>
                  <p className="text-sm font-medium text-ink mb-2">{g.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((opt) => {
                      const active = selected[g.name] === opt.id;
                      const disabled = Number(opt.stock) <= 0;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => selectVariant(g.name, opt.id)}
                          disabled={disabled}
                          className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                            active
                              ? "bg-primary text-white border-primary"
                              : disabled
                                ? "border-line text-muted line-through opacity-60 cursor-not-allowed"
                                : "border-line text-ink hover:border-primary"
                          }`}
                        >
                          {opt.value}
                          {Number(opt.price_adjustment) > 0 &&
                            ` (+৳${Number(opt.price_adjustment)})`}
                          {Number(opt.price_adjustment) < 0 &&
                            ` (−৳${Math.abs(Number(opt.price_adjustment))})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {groups.length > 0 && !allSelected && (
            <p className="text-xs text-muted mb-4">
              Please select all options above to continue.
            </p>
          )}

          {outOfStock ? (
            <p className="text-sm font-medium text-red-500 mb-4">Out of stock</p>
          ) : (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-line rounded-full">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-ink hover:bg-primary/5 rounded-full transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm text-ink">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(effectiveStock, q + 1))
                  }
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-ink hover:bg-primary/5 rounded-full transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-xs text-muted">
                {effectiveStock} in stock
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || !allSelected}
              className="flex-1 btn btn-outline"
            >
              {addedMsg ? (
                <Check size={16} />
              ) : (
                <ShoppingBag size={16} />
              )}
              {addedMsg ? "Added" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock || !allSelected}
              className="flex-1 btn btn-accent"
            >
              <Zap size={16} />
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-xl text-ink mb-6">Reviews</h2>
        <ReviewsList
          reviews={product.reviews || []}
          avgRating={product.avg_rating}
          reviewCount={product.review_count}
        />
      </section>
    </>
  );
}
