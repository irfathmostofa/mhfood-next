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
     HYDRATION
  ============================================================ */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ============================================================
     SEARCH FOCUS
  ============================================================ */

  useEffect(() => {
    if (!searchOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [searchOpen]);

  /* ============================================================
     KEYBOARD SHORTCUTS
  ============================================================ */

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();

        setSearchOpen(true);
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
     SEARCH
  ============================================================ */

  function submitSearch(e) {
    e.preventDefault();

    const q = query.trim();

    setSearchOpen(false);

    if (q) {
      router.push(`/shop?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  }

  /* ============================================================
     STORE NAME
  ============================================================ */

  const storeName = theme?.logo_text || theme?.store_name || "MHFood";

  /* ============================================================
     LOGO
  ============================================================ */

  const logo = (
    <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mhfood.png"
        alt={storeName}
        className="h-8 sm:h-9 lg:h-10 w-auto shrink-0"
      />

      <span className="hidden xs:inline text-base sm:text-lg lg:text-xl font-semibold tracking-tight text-ink truncate max-w-[140px] sm:max-w-[180px] lg:max-w-none">
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
     DESKTOP NAVIGATION
  ============================================================ */

  const nav = (
    <nav className="flex items-center gap-0.5 xl:gap-1">
      {NAV_LINKS.map((link) => {
        const active =
          link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);

        return (
          <Link
            key={link.to}
            href={link.to}
            className={`whitespace-nowrap px-2.5 xl:px-3.5 py-2 rounded-full text-xs xl:text-[13px] font-medium transition-colors ${
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
     SEARCH BUTTON
  ============================================================ */

  const searchButton = (
    <button
      type="button"
      onClick={() => setSearchOpen((value) => !value)}
      aria-label="Search"
      className="shrink-0 p-2 sm:p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
    >
      <Search size={19} />
    </button>
  );

  /* ============================================================
     CART BUTTON
  ============================================================ */

  const cartButton = (
    <button
      type="button"
      onClick={openCart}
      aria-label="Open cart"
      className="relative shrink-0 p-2 sm:p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
    >
      <ShoppingBag size={19} />

      {mounted && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-bold rounded-full bg-accent text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );

  /* ============================================================
     MOBILE / TABLET MENU BUTTON
  ============================================================ */

  const menuButton = (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      aria-label="Open menu"
      className="shrink-0 p-2 sm:p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
    >
      <Menu size={20} />
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line">
      {/* ========================================================
          ANNOUNCEMENT BAR
      ========================================================= */}

      {theme?.show_announcement_bar && theme?.announcement_text && (
        <div className="bg-primary text-white text-center text-xs sm:text-sm font-medium px-3 sm:px-4 py-2">
          {theme.announcement_text}
        </div>
      )}

      {/* ========================================================
          MAIN HEADER
      ========================================================= */}

      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="h-16 lg:h-[4.5rem] flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* ====================================================
              LOGO
          ===================================================== */}

          <div className="shrink-0">{logo}</div>

          {/* ====================================================
              DESKTOP NAVIGATION
              >= 1024px
          ===================================================== */}

          <div className="hidden lg:flex items-center flex-1 min-w-0">
            {nav}
          </div>

          {/* ====================================================
              DESKTOP SEARCH
              >= 1024px
          ===================================================== */}

          <div className="hidden lg:flex items-center justify-end min-w-0">
            <form
              onSubmit={submitSearch}
              className={`flex items-center overflow-hidden rounded-full border transition-all duration-300 ${
                searchOpen
                  ? "w-40 xl:w-56 pl-3 xl:pl-4 pr-1.5 py-1.5 border-line opacity-100"
                  : "w-0 border-transparent opacity-0"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search food..."
                className="w-full min-w-0 bg-transparent text-sm outline-none text-ink placeholder-muted"
              />

              <button
                type="submit"
                aria-label="Submit search"
                className="shrink-0 p-1.5 rounded-full bg-primary text-white"
              >
                <Search size={13} />
              </button>
            </form>
          </div>

          {/* ====================================================
              DESKTOP ACTIONS
              >= 1024px
          ===================================================== */}

          <div className="hidden lg:flex items-center shrink-0">
            {searchButton}
            {cartButton}
          </div>

          {/* ====================================================
              MOBILE / TABLET ACTIONS
              < 1024px
          ===================================================== */}

          <div className="lg:hidden flex items-center gap-0.5 ml-auto shrink-0">
            {searchButton}
            {cartButton}
            {menuButton}
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE / TABLET SEARCH
          < 1024px
      ========================================================= */}

      {searchOpen && (
        <div className="lg:hidden border-t border-line bg-surface px-3 sm:px-5 pb-3 sm:pb-4">
          <form onSubmit={submitSearch} className="relative pt-3">
            <Search
              size={18}
              className="absolute left-3.5 top-[calc(50%+6px)] -translate-y-1/2 text-muted"
            />

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food..."
              className="w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/30 border border-line bg-background"
            />

            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 text-muted hover:text-ink"
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          MOBILE / TABLET MENU OVERLAY
      ========================================================= */}

      <div
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 lg:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ========================================================
          MOBILE / TABLET MENU DRAWER
      ========================================================= */}

      {menuOpen && (
        <aside
          className="fixed top-0 right-0 h-[100dvh] w-[min(20rem,85vw)] bg-surface z-[70] shadow-2xl flex flex-col lg:hidden"
          aria-label="Mobile navigation"
        >
          {/* ====================================================
              DRAWER HEADER
          ===================================================== */}

          <div className="flex items-center justify-between px-4 sm:px-5 h-16 border-b border-line shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mhfood.png"
                alt={storeName}
                className="h-8 w-auto shrink-0"
              />

              <span className="font-display text-base sm:text-lg text-ink truncate">
                {storeName}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="shrink-0 p-2 rounded-full hover:bg-primary/5 text-ink transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* ====================================================
              DRAWER NAVIGATION
          ===================================================== */}

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

          {/* ====================================================
              DRAWER CART
          ===================================================== */}

          <div className="border-t border-line px-4 sm:px-5 py-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
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
