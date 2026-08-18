"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    totalAmount,
  } = useCart();
  const router = useRouter();

  function handleCheckout() {
    closeCart();
    router.push("/checkout");
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[26rem] bg-background z-[70] shadow-2xl flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
          <h2 className="font-display text-lg text-ink">Your Cart</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-1.5 rounded-full hover:bg-primary/5 text-ink"
          >
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
            <p className="text-sm text-muted mb-1">Your cart is empty</p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="text-sm text-accent hover:underline mt-2"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => (
                <li key={item._key} className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-primary/5 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        item.image_url ||
                        "https://placehold.co/100x100?text=No+Image"
                      }
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {item.product_name}
                    </p>
                    {item.variant_text && (
                      <p className="text-xs text-muted truncate mt-0.5">
                        {item.variant_text}
                      </p>
                    )}
                    <p className="text-sm text-accent font-semibold mt-1">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item._key,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        aria-label="Decrease quantity"
                        className="w-6 h-6 flex items-center justify-center border border-line rounded-full text-ink hover:bg-primary/5"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs text-ink w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item._key, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="w-6 h-6 flex items-center justify-center border border-line rounded-full text-ink hover:bg-primary/5"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item._key)}
                        aria-label="Remove item"
                        className="text-red-500 hover:underline text-xs ml-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-4 shrink-0 bg-surface">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-ink">Subtotal</span>
                <span className="text-lg font-semibold text-accent">
                  ৳{totalAmount.toFixed(2)}
                </span>
              </div>
              <button onClick={handleCheckout} className="btn btn-primary w-full">
                Go to Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
