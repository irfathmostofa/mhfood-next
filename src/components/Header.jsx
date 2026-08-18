"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/track", label: "Track Order" },
];

export default function Header({ theme }) {
  const router = useRouter();
  const pathname = usePathname();

  const { itemCount, openCart } = useCart();

  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inputRef = useRef(null);

  /* ============================================================
     HYDRATION FIX
  ============================================================ */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ============================================================
     SEARCH FOCUS
  ============================================================ */

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  /* ============================================================
     KEYBOARD SHORTCUTS
  ============================================================ */

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();

        setSearchOpen(true);
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* ============================================================
     ROUTE CHANGE
  ============================================================ */

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  /* ============================================================
     SEARCH SUBMIT
  ============================================================ */

  function submitSearch(e) {
    e.preventDefault();

    const q = query.trim();

    setSearchOpen(false);

    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  /* ============================================================
     STORE NAME
  ============================================================ */

  const storeName = theme?.logo_text || theme?.store_name || "MHFood";

  /* ============================================================
     LOGO
  ============================================================ */

  const logo = (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mhfood.png" alt={storeName} className="h-9 sm:h-10 w-auto" />

      <span className="text-lg sm:text-xl font-semibold tracking-tight text-ink">
        {storeName.split(" ")[0]}

        <span className="text-accent">
          {storeName.split(" ").slice(1).join(" ")
            ? ` ${storeName.split(" ").slice(1).join(" ")}`
            : " Food"}
        </span>
      </span>
    </Link>
  );

  /* ============================================================
     NAVIGATION
  ============================================================ */

  const nav = (
    <nav className="flex items-center gap-1 lg:gap-2">
      {NAV_LINKS.map((link) => {
        const active =
          link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);

        return (
          <Link
            key={link.to}
            href={link.to}
            className={`px-3 lg:px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-muted hover:text-ink hover:bg-primary/5"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  /* ============================================================
     ACTIONS
  ============================================================ */

  const actions = (
    <div className="flex items-center gap-1">
      {/* Search */}
      <button
        type="button"
        onClick={() => setSearchOpen((value) => !value)}
        aria-label="Search"
        className="p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
      >
        <Search size={20} />
      </button>

      {/* Cart */}
      <button
        type="button"
        onClick={openCart}
        aria-label="Open cart"
        className="relative p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
      >
        <ShoppingBag size={20} />

        {/* Hydration-safe cart count */}
        {mounted && itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-accent text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line">
      {/* ========================================================
          ANNOUNCEMENT BAR
      ========================================================= */}

      {theme?.show_announcement_bar && theme?.announcement_text && (
        <div className="bg-primary text-white text-center text-xs sm:text-sm font-medium px-4 py-2">
          {theme.announcement_text}
        </div>
      )}

      {/* ========================================================
          MAIN HEADER
      ========================================================= */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        {logo}

        {/* ======================================================
            DESKTOP NAVIGATION
            Keep original design
        ======================================================= */}

        <div className="hidden lg:flex items-center">{nav}</div>

        {/* ======================================================
            DESKTOP SEARCH
            Keep original design
        ======================================================= */}

        <div className="hidden lg:flex items-center">
          <form
            onSubmit={submitSearch}
            className={`flex items-center overflow-hidden rounded-full border transition-all duration-300 ${
              searchOpen
                ? "w-56 pl-4 pr-1.5 py-1.5 border-line opacity-100"
                : "w-0 border-transparent opacity-0"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food..."
              className="w-full bg-transparent text-sm outline-none text-ink placeholder-muted"
            />

            <button
              type="submit"
              aria-label="Submit search"
              className="shrink-0 p-2 rounded-full bg-primary text-white"
            >
              <Search size={14} />
            </button>
          </form>
        </div>

        {/* ======================================================
            DESKTOP ACTIONS
            Original layout
        ======================================================= */}

        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {actions}
        </div>

        {/* ======================================================
            MOBILE + TABLET CONTROLS
            Use until lg
        ======================================================= */}

        <div className="lg:hidden flex items-center gap-1 ml-auto shrink-0">
          {actions}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ========================================================
          MOBILE / TABLET SEARCH
      ========================================================= */}

      {searchOpen && (
        <div className="lg:hidden px-4 pb-4">
          <form onSubmit={submitSearch} className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food..."
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/30 border border-line bg-background"
            />

            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          MOBILE / TABLET OVERLAY
      ========================================================= */}

      <div
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity lg:hidden ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ========================================================
          MOBILE / TABLET DRAWER
      ========================================================= */}

      {menuOpen && (
        <aside
          className="fixed top-0 right-0 h-[100dvh] w-72 max-w-[85vw] bg-surface z-[70] shadow-2xl flex flex-col lg:hidden"
          aria-label="Mobile navigation"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
            <span className="font-display text-lg text-ink truncate pr-3">
              {storeName}
            </span>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="p-1.5 rounded-full hover:bg-primary/5 text-ink shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_LINKS.map((link) => {
              const active =
                link.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.to);

              return (
                <Link
                  key={link.to}
                  href={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                    active
                      ? "text-accent bg-primary/5"
                      : "text-ink hover:text-accent hover:bg-primary/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Cart */}
          <div className="border-t border-line px-5 py-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              className="btn btn-primary w-full"
            >
              <ShoppingBag size={16} />
              View Cart ({mounted ? itemCount : 0})
            </button>
          </div>
        </aside>
      )}
    </header>
  );
}
