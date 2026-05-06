import type { products, categories, productImages } from "@reluxury/db/schema";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";

type ProductWithRelations = typeof products.$inferSelect & {
  category: typeof categories.$inferSelect | null;
  images: (typeof productImages.$inferSelect)[];
};

interface ProductCardProps {
  product: ProductWithRelations;
  mobileLayout?: "default" | "horizontal";
}

export default function ProductCard({
  product,
  mobileLayout = "default",
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [primaryImage] = product.images;
  const hasSale = product.salePrice && product.salePrice < product.price;
  const isHorizontalMobile = mobileLayout === "horizontal";

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className={`group block ${isHorizontalMobile ? "min-w-[19rem] snap-start md:min-w-0" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`rounded-xl border border-gold/10 bg-card p-2 ${isHorizontalMobile ? "flex gap-3 md:block md:rounded-none md:border-0 md:bg-transparent md:p-0" : ""}`}
      >
        <div
          className={`relative overflow-hidden rounded-lg border border-gold/5 bg-card ${isHorizontalMobile ? "aspect-square w-32 shrink-0 md:mb-3 md:w-auto md:aspect-[3/4]" : "mb-3 aspect-[3/4]"}`}
        >
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <span className="font-display text-gold/30 text-4xl">R</span>
            </div>
          )}

          <div
            className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && (
              <span className="inline-flex items-center rounded bg-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                Featured
              </span>
            )}
            {hasSale && (
              <span className="inline-flex items-center rounded bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                Sale
              </span>
            )}
            {product.condition !== "good" && (
              <span className="inline-flex items-center rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground backdrop-blur-sm">
                {product.condition.replace("_", " ")}
              </span>
            )}
          </div>

          <button
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-300 hover:bg-gold/20 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div
          className={`space-y-1 ${isHorizontalMobile ? "flex-1 md:flex-none" : ""}`}
        >
          {product.category && (
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {product.category.name}
            </p>
          )}
          <h3 className="text-sm font-medium text-foreground group-hover:text-gold transition-colors line-clamp-2">
            {product.title}
          </h3>
          <div className="flex items-center gap-2">
            {hasSale ? (
              <>
                <span className="text-sm font-semibold text-gold">
                  ${product.salePrice?.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
