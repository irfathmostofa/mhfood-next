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
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const storeName = theme?.logo_text || theme?.store_name || "MHFood";

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

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

  const actions = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setSearchOpen((v) => !v)}
        aria-label="Search"
        className="p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
      >
        <Search size={20} />
      </button>
      <button
        onClick={openCart}
        aria-label="Open cart"
        className="relative p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5 transition-colors"
      >
        <ShoppingBag size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-accent text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line">
      {/* Announcement bar */}
      {theme?.show_announcement_bar && theme?.announcement_text && (
        <div className="bg-primary text-white text-center text-xs sm:text-sm font-medium px-4 py-2">
          {theme.announcement_text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-4">
        {logo}

        <div className="hidden lg:flex items-center">{nav}</div>

        {/* Desktop search form */}
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

        <div className="hidden md:flex items-center gap-1">
          {actions}
          {/* <button
            onClick={openCart}
            aria-label="View cart"
            className="ml-1 hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ShoppingBag size={16} />
            View Cart
          </button> */}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1">
          {actions}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="p-2.5 rounded-full text-muted hover:text-ink hover:bg-primary/5"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-4">
          <form onSubmit={submitSearch} className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food..."
              className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/30 border border-line bg-background"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu drawer */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity md:hidden ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {menuOpen && (
        <aside className="fixed top-0 right-0 h-full w-72 bg-surface z-[70] shadow-2xl flex flex-col md:hidden">
          <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
            <span className="font-display text-lg text-ink">{storeName}</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="p-1.5 rounded-full hover:bg-primary/5 text-ink"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-3 text-sm font-medium text-ink hover:text-accent hover:bg-primary/5 rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line px-5 py-4 shrink-0">
            <button
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              className="btn btn-primary w-full"
            >
              <ShoppingBag size={16} /> View Cart ({itemCount})
            </button>
          </div>
        </aside>
      )}
    </header>
  );
}
