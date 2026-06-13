/* oxlint-disable no-use-before-define, func-style, complexity */
import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import { Skeleton } from "@reluxury/ui/components/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Scissors, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { addToCart } from "@/functions/cart";
import { getProductBySlug } from "@/functions/store";
import { authClient } from "@/lib/auth-client";
import { addToGuestCart } from "@/lib/guest-cart";
import { productBySlugQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/shop/$slug")({
  component: ProductDetailComponent,
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: params.slug });
    return { product };
  },
});

function ProductDetailComponent() {
  const loaderData = Route.useLoaderData();
  const { data: product, isLoading } = useQuery({
    ...productBySlugQueryOptions(Route.useParams().slug),
    initialData: loaderData.product,
  });

  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground mb-4">
          Product Not Found
        </h1>
        <Link to="/shop">
          <Button variant="outline" className="border-gold/20 text-gold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const sizes = product.sizes ? (JSON.parse(product.sizes) as string[]) : [];
  const images = product.images ?? [];
  const { salePrice } = product;
  const hasSale =
    salePrice !== null && salePrice !== undefined && salePrice < product.price;
  const currentPrice = hasSale ? salePrice : product.price;

  let buttonText: string;
  if (product.quantity === 0) {
    buttonText = "Out of Stock";
  } else if (isAdding) {
    buttonText = "Adding...";
  } else {
    buttonText = "Add to Cart";
  }

  const handleAddToCart = async () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    setIsAdding(true);
    try {
      if (session) {
        await addToCart({
          data: {
            productId: product.id,
            quantity,
            size: selectedSize,
          },
        });
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      } else {
        addToGuestCart({
          productId: product.id,
          quantity,
          size: selectedSize,
        });
      }
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      {/* Back */}
      <button
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-4"
        onClick={() => window.history.back()}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/shop" className="hover:text-gold transition-colors">
          Shop
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <span>{product.category.name}</span>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{product.title}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-xl border border-gold/10 bg-card overflow-hidden">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage].url}
                alt={images[selectedImage].alt || product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <span className="font-display text-6xl text-gold/20">R</span>
              </div>
            )}
          </div>

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`relative aspect-square rounded-lg border overflow-hidden transition-colors ${
                    selectedImage === i
                      ? "border-gold ring-2 ring-gold/50"
                      : "border-gold/10 hover:border-gold/30"
                  }`}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View image ${i + 1} of ${images.length}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="h-full w-full object-cover"
                  />
                  {selectedImage === i && (
                    <span className="absolute inset-0 ring-2 ring-gold ring-offset-2 ring-offset-background rounded-lg pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {product.category && (
                <Badge
                  variant="outline"
                  className="border-gold/20 text-gold text-xs"
                >
                  {product.category.name}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-gold/20 text-muted-foreground text-xs capitalize"
              >
                {product.condition.replace("_", " ")}
              </Badge>
              {product.gender && (
                <Badge
                  variant="outline"
                  className="border-gold/20 text-muted-foreground text-xs capitalize"
                >
                  {product.gender}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-light text-foreground">
              {product.title}
            </h1>
            {product.brand && (
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {product.brand}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gold">
              ${currentPrice.toFixed(2)}
            </span>
            {hasSale && (
              <span className="text-lg text-muted-foreground line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Size{" "}
                {selectedSize && (
                  <span className="text-gold">({selectedSize})</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`min-w-[3rem] px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-gold/10 text-muted-foreground hover:border-gold/30 hover:text-foreground"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                className="w-10 h-10 rounded-md border border-gold/10 flex items-center justify-center text-muted-foreground hover:border-gold/30 hover:text-foreground transition-colors"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                className="w-10 h-10 rounded-md border border-gold/10 flex items-center justify-center text-muted-foreground hover:border-gold/30 hover:text-foreground transition-colors"
                onClick={() =>
                  setQuantity((q) => Math.min(product.quantity, q + 1))
                }
              >
                +
              </button>
              <span className="text-sm text-muted-foreground ml-2">
                {product.quantity} available
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1 bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
              disabled={isAdding || product.quantity === 0}
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
              {buttonText}
            </Button>
            <Link to="/alterations" className="flex-1 sm:flex-initial">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-gold/20 text-gold hover:bg-gold/10 gap-2"
              >
                <Scissors className="h-4 w-4" />
                Book Alteration
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gold/10 pt-6 space-y-3">
            {product.material && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Material</span>
                <span className="text-foreground">{product.material}</span>
              </div>
            )}
            {product.sku && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SKU</span>
                <span className="text-foreground">{product.sku}</span>
              </div>
            )}
            {product.colors && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Colors</span>
                <span className="text-foreground">
                  {(JSON.parse(product.colors) as string[]).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
