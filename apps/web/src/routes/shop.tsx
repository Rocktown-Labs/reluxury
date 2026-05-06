import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@reluxury/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@reluxury/ui/components/sheet";
import {
  Outlet,
  createFileRoute,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useCallback } from "react";
import { z } from "zod";

import ProductCard from "@/components/product-card";
import {
  getProducts,
  getCategories,
  getProductBrands,
} from "@/functions/store";

const searchSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  gender: z.string().optional(),
  page: z.number().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).optional(),
});

export const Route = createFileRoute("/shop")({
  component: ShopComponent,
  loader: async ({ deps }) => {
    const [productsResult, categoriesList, brands] = await Promise.all([
      getProducts({
        data: {
          brand: deps.brand,
          category: deps.category,
          condition: deps.condition,
          gender: deps.gender,
          limit: 12,
          page: deps.page ?? 1,
          search: deps.search,
          sort: deps.sort,
        },
      }),
      getCategories(),
      getProductBrands(),
    ]);
    return { brands, categoriesList, productsResult };
  },
  loaderDeps: ({ search }) => search,
  validateSearch: searchSchema,
});

function ShopComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  if (pathname !== "/shop" && pathname !== "/shop/") {
    return <Outlet />;
  }

  const search = useSearch({ from: "/shop" });
  const navigate = Route.useNavigate();
  const { productsResult, categoriesList, brands } = Route.useLoaderData();

  const [localSearch, setLocalSearch] = useState(search.search ?? "");

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      navigate({
        search: (prev) => ({ ...prev, [key]: value, page: 1 }),
      });
    },
    [navigate]
  );

  const activeFiltersCount = [
    search.category,
    search.gender,
    search.condition,
    search.brand,
    search.search,
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-10 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Browse Collection
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-light text-foreground">
            Shop
          </h1>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9 bg-card border-gold/10"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilter("search", localSearch || undefined);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={search.sort ?? "newest"}
              onValueChange={(v) => updateFilter("sort", v)}
            >
              <SelectTrigger className="w-[160px] bg-card border-gold/10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gold/10 lg:hidden gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-gold text-[10px] text-primary-foreground flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-card border-gold/10"
              >
                <FiltersPanel
                  search={search}
                  categories={categoriesList}
                  brands={brands}
                  onUpdateFilter={updateFilter}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {search.category && (
              <FilterBadge
                label={
                  categoriesList.find((c) => c.id === search.category)?.name ??
                  "Category"
                }
                onRemove={() => updateFilter("category")}
              />
            )}
            {search.gender && (
              <FilterBadge
                label={
                  search.gender.charAt(0).toUpperCase() + search.gender.slice(1)
                }
                onRemove={() => updateFilter("gender")}
              />
            )}
            {search.condition && (
              <FilterBadge
                label={search.condition.replace("_", " ")}
                onRemove={() => updateFilter("condition")}
              />
            )}
            {search.brand && (
              <FilterBadge
                label={search.brand}
                onRemove={() => updateFilter("brand")}
              />
            )}
            {search.search && (
              <FilterBadge
                label={`"${search.search}"`}
                onRemove={() => updateFilter("search")}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-gold"
              onClick={() => {
                navigate({ search: {} });
                setLocalSearch("");
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FiltersPanel
            search={search}
            categories={categoriesList}
            brands={brands}
            onUpdateFilter={updateFilter}
          />
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-6">
            Showing {productsResult.items.length} of {productsResult.total}{" "}
            products
          </p>

          {productsResult.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {productsResult.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No products found matching your criteria.
              </p>
              <Button
                variant="link"
                className="text-gold mt-2"
                onClick={() => {
                  navigate({ search: {} });
                  setLocalSearch("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {productsResult.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                className="border-gold/10"
                disabled={productsResult.page <= 1}
                onClick={() =>
                  updateFilter("page", String(productsResult.page - 1))
                }
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {productsResult.page} of {productsResult.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-gold/10"
                disabled={productsResult.page >= productsResult.totalPages}
                onClick={() =>
                  updateFilter("page", String(productsResult.page + 1))
                }
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({
  search,
  categories,
  brands,
  onUpdateFilter,
}: {
  search: z.infer<typeof searchSchema>;
  categories: Awaited<ReturnType<typeof getCategories>>;
  brands: Awaited<ReturnType<typeof getProductBrands>>;
  onUpdateFilter: (key: string, value: string | undefined) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-lg text-foreground mb-4">
          Categories
        </h3>
        <div className="space-y-2">
          <button
            className={`block text-sm w-full text-left transition-colors ${!search.category ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => onUpdateFilter("category")}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`block text-sm w-full text-left transition-colors ${search.category === cat.id ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => onUpdateFilter("category", cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-foreground mb-4">Gender</h3>
        <div className="space-y-2">
          {[
            { label: "Women", value: "women" },
            { label: "Men", value: "men" },
            { label: "Unisex", value: "unisex" },
          ].map((g) => (
            <button
              key={g.value}
              className={`block text-sm w-full text-left transition-colors ${search.gender === g.value ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() =>
                onUpdateFilter(
                  "gender",
                  search.gender === g.value ? undefined : g.value
                )
              }
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-foreground mb-4">Condition</h3>
        <div className="space-y-2">
          {[
            { label: "New", value: "new" },
            { label: "Like New", value: "like_new" },
            { label: "Excellent", value: "excellent" },
            { label: "Good", value: "good" },
            { label: "Fair", value: "fair" },
          ].map((c) => (
            <button
              key={c.value}
              className={`block text-sm w-full text-left transition-colors ${search.condition === c.value ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() =>
                onUpdateFilter(
                  "condition",
                  search.condition === c.value ? undefined : c.value
                )
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-foreground mb-4">Brands</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <button
                key={brand}
                className={`block text-sm w-full text-left transition-colors ${search.brand === brand ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() =>
                  onUpdateFilter(
                    "brand",
                    search.brand === brand ? undefined : brand
                  )
                }
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
