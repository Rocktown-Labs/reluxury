/* oxlint-disable no-use-before-define */
import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@reluxury/ui/components/dialog";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { Skeleton } from "@reluxury/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reluxury/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reluxury/ui/components/tabs";
import { Textarea } from "@reluxury/ui/components/textarea";
/* oxlint-disable func-style */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Scissors,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Star,
  Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

import {
  adminGetStats,
  adminGetProducts,
  adminGetOrders,
  adminGetEvents,
  adminGetAlterations,
  adminGetPromotions,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUpdateOrderStatus,
  adminCreateEvent,
  adminDeleteEvent,
  adminUpdateAlteration,
  adminCreatePromotion,
  adminDeletePromotion,
  adminUploadProductImage,
  adminDeleteProductImage,
  adminSetPrimaryImage,
  adminAddProductImages,
} from "@/functions/admin";
import { getUser } from "@/functions/get-user";
import {
  adminStatsQueryOptions,
  adminProductsQueryOptions,
  adminOrdersQueryOptions,
  adminEventsQueryOptions,
  adminAlterationsQueryOptions,
  adminPromotionsQueryOptions,
} from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

function readFileAsBase64(file: File): Promise<string> {
  // oxlint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getUser();
    if (!session || session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { session };
  },
  component: AdminComponent,
  loader: async () => {
    const [stats, products, orders, events, alterations, promotions] =
      await Promise.all([
        adminGetStats(),
        adminGetProducts(),
        adminGetOrders(),
        adminGetEvents(),
        adminGetAlterations(),
        adminGetPromotions(),
      ]);
    return { alterations, events, orders, products, promotions, stats };
  },
});

function AdminComponent() {
  const loaderData = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: stats, isLoading: statsLoading } = useQuery({
    ...adminStatsQueryOptions(),
    initialData: loaderData.stats,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    ...adminProductsQueryOptions(),
    initialData: loaderData.products,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    ...adminOrdersQueryOptions(),
    initialData: loaderData.orders,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    ...adminEventsQueryOptions(),
    initialData: loaderData.events,
  });

  const { data: alterations, isLoading: alterationsLoading } = useQuery({
    ...adminAlterationsQueryOptions(),
    initialData: loaderData.alterations,
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery({
    ...adminPromotionsQueryOptions(),
    initialData: loaderData.promotions,
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      <div className="space-y-2 mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          Management
        </p>
        <h1 className="font-display text-3xl font-light text-foreground">
          Admin Panel
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-gold/10 mb-8 flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="alterations" className="gap-2">
            <Scissors className="h-4 w-4" />
            Alterations
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {statsLoading ? (
            <DashboardSkeleton />
          ) : (
            <DashboardStats stats={stats} />
          )}
        </TabsContent>

        <TabsContent value="products">
          {productsLoading ? (
            <ProductsSkeleton />
          ) : (
            <ProductsAdmin products={products} />
          )}
        </TabsContent>

        <TabsContent value="orders">
          {ordersLoading ? <OrdersSkeleton /> : <OrdersAdmin orders={orders} />}
        </TabsContent>

        <TabsContent value="events">
          {eventsLoading ? <EventsSkeleton /> : <EventsAdmin events={events} />}
        </TabsContent>

        <TabsContent value="alterations">
          {alterationsLoading ? (
            <AlterationsSkeleton />
          ) : (
            <AlterationsAdmin alterations={alterations} />
          )}
        </TabsContent>

        <TabsContent value="promotions">
          {promotionsLoading ? (
            <PromotionsSkeleton />
          ) : (
            <PromotionsAdmin promotions={promotions} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardStats({
  stats,
}: {
  stats: Awaited<ReturnType<typeof adminGetStats>>;
}) {
  const cards = [
    { icon: ShoppingCart, label: "Total Orders", value: stats.totalOrders },
    {
      icon: LayoutDashboard,
      label: "Total Revenue",
      value: `$${Number(stats.totalRevenue).toFixed(2)}`,
    },
    { icon: Package, label: "Products", value: stats.totalProducts },
    { icon: Calendar, label: "Active Events", value: stats.activeEvents },
    { icon: ShoppingCart, label: "Pending Orders", value: stats.pendingOrders },
    {
      icon: Scissors,
      label: "Pending Alterations",
      value: stats.pendingAlterations,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-6 rounded-xl border border-gold/10 bg-card space-y-2"
        >
          <card.icon className="h-5 w-5 text-gold" />
          <p className="text-2xl font-semibold text-foreground">{card.value}</p>
          <p className="text-sm text-muted-foreground">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-xl border border-gold/10 bg-card space-y-2"
        >
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-16" />
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlterationsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromotionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin({
  products,
}: {
  products: Awaited<ReturnType<typeof adminGetProducts>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<
    (typeof products)[0] | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { url: string; file?: File }[]
  >([]);
  const [formData, setFormData] = useState({
    brand: "",
    condition: "good" as const,
    description: "",
    featured: false,
    gender: "women" as const,
    imageUrls: "",
    isActive: true,
    price: "",
    quantity: "1",
    salePrice: "",
    sizes: "",
    sku: "",
    slug: "",
    title: "",
  });

  const resetForm = () => {
    setFormData({
      brand: "",
      condition: "good",
      description: "",
      featured: false,
      gender: "women",
      imageUrls: "",
      isActive: true,
      price: "",
      quantity: "1",
      salePrice: "",
      sizes: "",
      sku: "",
      slug: "",
      title: "",
    });
    setEditingProduct(null);
    setPendingImages([]);
  };

  const handleEdit = (product: (typeof products)[0]) => {
    setEditingProduct(product);
    setFormData({
      brand: product.brand ?? "",
      condition: product.condition as typeof formData.condition,
      description: product.description ?? "",
      featured: product.featured,
      gender: product.gender as typeof formData.gender,
      imageUrls: "",
      isActive: product.isActive,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      salePrice: product.salePrice?.toString() ?? "",
      sizes: product.sizes ? JSON.parse(product.sizes).join(", ") : "",
      sku: product.sku ?? "",
      slug: product.slug,
      title: product.title,
    });
    setPendingImages(
      product.images?.map((i) => ({ file: undefined, url: i.url })) ?? []
    );
    setIsModalOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    const newImages: { url: string; file?: File }[] = [];

    for (const file of files) {
      try {
        const base64 = await readFileAsBase64(file);

        const result = await adminUploadProductImage({
          data: {
            base64,
            contentType: file.type,
            fileName: file.name,
          },
        });

        newImages.push({ file, url: result.url });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setPendingImages((prev) => [...prev, ...newImages]);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = pendingImages[index];
    if (!image) {
      return;
    }

    if (editingProduct && !image.file) {
      const existingImage = editingProduct.images?.find(
        (i) => i.url === image.url
      );
      if (existingImage) {
        try {
          await adminDeleteProductImage({ data: existingImage.id });
          toast.success("Image deleted");
        } catch {
          toast.error("Failed to delete image");
          return;
        }
      }
    }

    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = async (index: number) => {
    if (!editingProduct) {
      return;
    }
    const image = pendingImages[index];
    if (!image) {
      return;
    }

    const existingImage = editingProduct.images?.find(
      (i) => i.url === image.url
    );
    if (existingImage) {
      try {
        await adminSetPrimaryImage({
          data: { imageId: existingImage.id, productId: editingProduct.id },
        });
        toast.success("Primary image updated");
      } catch {
        toast.error("Failed to update primary image");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const sizes = formData.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const imageUrls = formData.imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingProduct) {
        await adminUpdateProduct({
          data: {
            brand: formData.brand || null,
            condition: formData.condition,
            description: formData.description || undefined,
            featured: formData.featured,
            gender: formData.gender,
            id: editingProduct.id,
            isActive: formData.isActive,
            price: Number.parseFloat(formData.price),
            quantity: Number.parseInt(formData.quantity, 10),
            salePrice: formData.salePrice
              ? Number.parseFloat(formData.salePrice)
              : null,
            sizes,
            sku: formData.sku || null,
            title: formData.title,
          },
        });

        const newUploadUrls = pendingImages
          .filter((img) => img.file)
          .map((img) => img.url);
        if (newUploadUrls.length > 0) {
          await adminAddProductImages({
            data: { productId: editingProduct.id, urls: newUploadUrls },
          });
        }

        toast.success("Product updated");
      } else {
        const allImageUrls = [
          ...imageUrls,
          ...pendingImages.map((img) => img.url),
        ];
        await adminCreateProduct({
          data: {
            brand: formData.brand || undefined,
            condition: formData.condition,
            description: formData.description || undefined,
            featured: formData.featured,
            gender: formData.gender,
            imageUrls: allImageUrls,
            isActive: formData.isActive,
            price: Number.parseFloat(formData.price),
            quantity: Number.parseInt(formData.quantity, 10),
            salePrice: formData.salePrice
              ? Number.parseFloat(formData.salePrice)
              : undefined,
            sizes,
            sku: formData.sku || undefined,
            slug: formData.slug,
            title: formData.title,
          },
        });
        toast.success("Product created");
      }
      setIsModalOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    // oxlint-disable-next-line no-alert
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await adminDeleteProduct({ data: id });
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Products</h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="border-gold/10">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-xs text-gold/30">
                          R
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.brand}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gold">${product.price.toFixed(2)}</span>
                </TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      product.isActive
                        ? "text-green-500 border-green-500/20"
                        : "text-muted-foreground"
                    }
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="border-gold/10"
                  disabled={!!editingProduct}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, salePrice: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Condition</Label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: e.target.value as typeof formData.condition,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm"
                >
                  {["new", "like_new", "excellent", "good", "fair"].map((c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as typeof formData.gender,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm"
                >
                  {["women", "men", "unisex"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sizes (comma-separated)</Label>
              <Input
                value={formData.sizes}
                onChange={(e) =>
                  setFormData({ ...formData, sizes: e.target.value })
                }
                className="border-gold/10"
                placeholder="S, M, L, XL"
              />
            </div>

            {/* Images */}
            <div className="space-y-3">
              <Label>Images</Label>
              {pendingImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {pendingImages.map((img, i) => (
                    <div
                      key={`${img.url}-${i}`}
                      className="relative aspect-square rounded-lg border border-gold/10 overflow-hidden group"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {editingProduct && (
                          <button
                            type="button"
                            className="p-1 rounded bg-gold/90 text-primary-foreground hover:bg-gold"
                            onClick={() => handleSetPrimary(i)}
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-1 rounded bg-destructive/90 text-white hover:bg-destructive"
                          onClick={() => handleRemoveImage(i)}
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-gold/10 gap-2"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Images"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, WebP up to 10MB
                </span>
              </div>
              {!editingProduct && (
                <div className="space-y-2">
                  <Label>Or paste image URLs (one per line)</Label>
                  <Textarea
                    value={formData.imageUrls}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrls: e.target.value })
                    }
                    className="border-gold/10"
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gold/10"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmit}
            >
              {editingProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersAdmin({
  orders,
}: {
  orders: Awaited<ReturnType<typeof adminGetOrders>>;
}) {
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminUpdateOrderStatus({
        data: {
          id,
          status: status as
            | "pending"
            | "confirmed"
            | "preparing"
            | "ready_for_pickup"
            | "shipped"
            | "completed"
            | "cancelled",
        },
      });
      await queryClient.invalidateQueries({
        queryKey: adminOrdersQueryOptions().queryKey,
      });
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  const statusOptions = [
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "shipped",
    "completed",
    "cancelled",
  ] as const;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Orders</h2>
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-gold/10">
                <TableCell className="font-medium text-sm">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="text-sm">{order.name}</TableCell>
                <TableCell className="text-gold">
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleUpdateStatus(order.id, e.target.value)
                    }
                    className="text-xs rounded border border-gold/10 bg-background px-2 py-1"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EventsAdmin({
  events,
}: {
  events: Awaited<ReturnType<typeof adminGetEvents>>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    capacity: "",
    description: "",
    endDate: "",
    imageUrl: "",
    instructor: "",
    location: "",
    price: "",
    slug: "",
    startDate: "",
    title: "",
  });

  const handleSubmit = async () => {
    try {
      await adminCreateEvent({
        data: {
          capacity: formData.capacity
            ? Number.parseInt(formData.capacity, 10)
            : undefined,
          description: formData.description || undefined,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : undefined,
          imageUrl: formData.imageUrl || undefined,
          instructor: formData.instructor || undefined,
          location: formData.location || undefined,
          price: Number.parseFloat(formData.price) || 0,
          slug: formData.slug,
          startDate: new Date(formData.startDate).toISOString(),
          title: formData.title,
        },
      });
      toast.success("Event created");
      setIsModalOpen(false);
      await queryClient.invalidateQueries({
        queryKey: adminEventsQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to create event");
    }
  };

  const handleDelete = async (id: string) => {
    // oxlint-disable-next-line no-alert
    if (!confirm("Delete this event?")) {
      return;
    }
    try {
      await adminDeleteEvent({ data: id });
      await queryClient.invalidateQueries({
        queryKey: adminEventsQueryOptions().queryKey,
      });
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Events</h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="border-gold/10">
                <TableCell className="font-medium text-sm">
                  {event.title}
                </TableCell>
                <TableCell className="text-sm">
                  {event.startDate
                    ? new Date(event.startDate).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell className="text-sm">
                  {event.registrations?.length ?? 0}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      event.isActive
                        ? "text-green-500 border-green-500/20"
                        : "text-muted-foreground"
                    }
                  >
                    {event.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input
                value={formData.instructor}
                onChange={(e) =>
                  setFormData({ ...formData, instructor: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gold/10"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmit}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlterationsAdmin({
  alterations,
}: {
  alterations: Awaited<ReturnType<typeof adminGetAlterations>>;
}) {
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminUpdateAlteration({
        data: {
          id,
          status: status as Parameters<
            typeof adminUpdateAlteration
          >[0]["data"]["status"],
        },
      });
      await queryClient.invalidateQueries({
        queryKey: adminAlterationsQueryOptions().queryKey,
      });
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const statusOptions = [
    "pending",
    "approved",
    "in_progress",
    "completed",
    "cancelled",
  ] as const;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">
        Alteration Bookings
      </h2>
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead>Service</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alterations.map((booking) => (
              <TableRow key={booking.id} className="border-gold/10">
                <TableCell className="font-medium text-sm">
                  {booking.serviceType}
                </TableCell>
                <TableCell className="text-sm">{booking.user?.name}</TableCell>
                <TableCell className="text-sm">
                  {booking.preferredDate
                    ? new Date(booking.preferredDate).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell>
                  <select
                    value={booking.status}
                    onChange={(e) =>
                      handleUpdateStatus(booking.id, e.target.value)
                    }
                    className="text-xs rounded border border-gold/10 bg-background px-2 py-1"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PromotionsAdmin({
  promotions,
}: {
  promotions: Awaited<ReturnType<typeof adminGetPromotions>>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    buttonLink: "",
    buttonText: "",
    description: "",
    displayLocation: "both" as const,
    imageUrl: "",
    subtitle: "",
    title: "",
  });

  const handleSubmit = async () => {
    try {
      await adminCreatePromotion({ data: formData });
      toast.success("Promotion created");
      setIsModalOpen(false);
      await queryClient.invalidateQueries({
        queryKey: adminPromotionsQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to create promotion");
    }
  };

  const handleDelete = async (id: string) => {
    // oxlint-disable-next-line no-alert
    if (!confirm("Delete this promotion?")) {
      return;
    }
    try {
      await adminDeletePromotion({ data: id });
      await queryClient.invalidateQueries({
        queryKey: adminPromotionsQueryOptions().queryKey,
      });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Promotions</h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Promotion
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promo) => (
              <TableRow key={promo.id} className="border-gold/10">
                <TableCell className="font-medium text-sm">
                  {promo.title}
                </TableCell>
                <TableCell className="text-sm capitalize">
                  {promo.displayLocation}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      promo.isActive
                        ? "text-green-500 border-green-500/20"
                        : "text-muted-foreground"
                    }
                  >
                    {promo.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(promo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={formData.buttonText}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonText: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={formData.buttonLink}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonLink: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Location</Label>
              <select
                value={formData.displayLocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayLocation: e.target
                      .value as typeof formData.displayLocation,
                  })
                }
                className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm"
              >
                <option value="homepage">Homepage</option>
                <option value="shop">Shop</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gold/10"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmit}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
