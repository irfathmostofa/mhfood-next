import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export default async function CategoriesGrid({ title, subtitle, limit }) {
  const categories = await getCategories();

  const { data: prodRows } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_active", true);

  const countMap = {};
  (prodRows || []).forEach((p) => {
    if (!p.category_id) return;
    countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
  });

  const cats = (limit ? categories.slice(0, limit) : categories).filter(
    (c) => countMap[c.id] > 0 || true,
  );

  if (cats.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 py-10">
      <div className="mb-6 px-1.5">
        <h2 className="font-display text-2xl sm:text-3xl text-ink">
          {title || "Shop by Category"}
        </h2>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {cats.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.id}`}
            className="group card overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <div className="aspect-[4/3] bg-primary/5 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image_url || "https://placehold.co/400x300?text=Category"}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <p className="font-display text-base sm:text-lg font-medium">
                  {cat.name}
                </p>
                <p className="text-xs text-white/80">
                  {countMap[cat.id] || 0} product{countMap[cat.id] === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium text-ink group-hover:text-accent transition-colors">
                Browse
              </span>
              <ChevronRight size={16} className="text-muted group-hover:text-accent transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
