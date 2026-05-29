/* oxlint-disable no-use-before-define, func-style, typescript/no-explicit-any, complexity */
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
import { Textarea } from "@reluxury/ui/components/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
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
  Menu,
  X,
  Users,
  Settings,
  Bell,
  Sparkles,
  Search,
  Tag,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import CalendarAdmin from "@/components/calendar-admin";
import {
  adminGetStats,
  adminGetProducts,
  adminGetOrders,
  adminGetEvents,
  adminGetAlterations,
  adminGetPromotions,
  adminGetCustomers,
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
  adminCreateAlteration as serverAdminCreateAlteration,
  adminUpdateFooterContact,
  adminCreateCategory,
  adminDeleteCategory,
} from "@/functions/admin";
import { getUser } from "@/functions/get-user";
import { getFooterContact, getCategories } from "@/functions/store";
import {
  adminStatsQueryOptions,
  adminProductsQueryOptions,
  adminOrdersQueryOptions,
  adminEventsQueryOptions,
  adminAlterationsQueryOptions,
  adminPromotionsQueryOptions,
  adminCustomersQueryOptions,
  footerContactQueryOptions,
  categoriesQueryOptions,
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
    const [
      stats,
      products,
      orders,
      events,
      alterations,
      promotions,
      customers,
      contact,
      categories,
    ] = await Promise.all([
      adminGetStats(),
      adminGetProducts(),
      adminGetOrders(),
      adminGetEvents(),
      adminGetAlterations(),
      adminGetPromotions(),
      adminGetCustomers(),
      getFooterContact(),
      getCategories(),
    ]);
    return {
      alterations,
      categories,
      contact,
      customers,
      events,
      orders,
      products,
      promotions,
      stats,
    };
  },
});

function AdminComponent() {
  const loaderData = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  // Simulated live indicator update trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasNewUpdates(true);
    }, 15_000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshData = async () => {
    setHasNewUpdates(false);
    toast.info("Refreshing administration database...");
    await queryClient.refetchQueries({ queryKey: ["admin"] });
    toast.success("Database fully synchronized");
  };

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

  const { data: customers, isLoading: customersLoading } = useQuery({
    ...adminCustomersQueryOptions(),
    initialData: loaderData.customers,
  });

  const { data: contact, isLoading: contactLoading } = useQuery({
    ...footerContactQueryOptions(),
    initialData: loaderData.contact,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    ...categoriesQueryOptions(),
    initialData: loaderData.categories,
  });

  const tabs = [
    { icon: LayoutDashboard, label: "Dashboard", value: "dashboard" },
    { icon: Calendar, label: "Calendar", value: "calendar" },
    { icon: Package, label: "Products", value: "products" },
    { icon: Tag, label: "Categories", value: "categories" },
    { icon: ShoppingCart, label: "Orders", value: "orders" },
    { icon: Calendar, label: "Workshops", value: "events" },
    { icon: Scissors, label: "Alterations", value: "alterations" },
    { icon: Users, label: "Customers", value: "customers" },
    { icon: Megaphone, label: "Promotions", value: "promotions" },
    { icon: Settings, label: "Settings", value: "settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative">
      {/* Mobile top-bar */}
      <div className="lg:hidden w-full bg-card border-b border-gold/10 px-4 py-4 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold tracking-[0.15em] text-gold">
            ReLUXURY ADMIN
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hasNewUpdates && (
            <Button
              size="icon"
              variant="ghost"
              className="relative text-gold"
              onClick={handleRefreshData}
            >
              <Bell className="h-5 w-5 animate-bounce" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gold" />
            ) : (
              <Menu className="h-6 w-6 text-gold" />
            )}
          </Button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } transition-transform duration-300 fixed lg:sticky top-[69px] lg:top-0 left-0 w-64 h-[calc(100vh-69px)] lg:h-screen bg-card border-r border-gold/10 z-30 p-6 flex flex-col justify-between shrink-0`}
      >
        <div className="space-y-8">
          <div className="hidden lg:flex items-center gap-2 pb-4 border-b border-gold/10">
            <Sparkles className="h-5 w-5 text-gold shrink-0" />
            <span className="font-display text-xl font-semibold tracking-[0.15em] text-gold">
              ReLUXURY
            </span>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-gold text-primary-foreground font-medium shadow-md shadow-gold/10"
                      : "text-muted-foreground hover:bg-gold/5 hover:text-gold"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-gold/10 text-xs text-muted-foreground/60">
          <p>EST. 2025 &middot; Maumelle, AR</p>
          {hasNewUpdates && (
            <Button
              size="xs"
              variant="outline"
              className="w-full text-[10px] border-gold/20 text-gold hover:bg-gold/10 gap-1.5 animate-pulse"
              onClick={handleRefreshData}
            >
              <Bell className="h-3 w-3" /> Live Update Pending
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-4 lg:p-8 space-y-6">
        {/* Real-time Indicator Alert Banner */}
        {hasNewUpdates && (
          <div className="p-4 bg-gold/5 border border-gold/10 rounded-xl flex items-center justify-between gap-4 text-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
              </span>
              <p className="text-muted-foreground">
                <span className="text-gold font-medium">Database Alert:</span>{" "}
                New customer events or orders have occurred. Click refresh to
                sync.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-gold/20 text-gold hover:bg-gold/10 shrink-0 text-xs"
              onClick={handleRefreshData}
            >
              Refresh
            </Button>
          </div>
        )}

        <div className="space-y-6">
          <AdminTabContent
            activeTab={activeTab}
            statsLoading={statsLoading}
            stats={stats}
            alterationsLoading={alterationsLoading}
            eventsLoading={eventsLoading}
            alterations={alterations}
            events={events}
            productsLoading={productsLoading}
            products={products}
            ordersLoading={ordersLoading}
            orders={orders}
            customersLoading={customersLoading}
            customers={customers}
            promotionsLoading={promotionsLoading}
            promotions={promotions}
            contactLoading={contactLoading}
            contact={contact}
            categories={categories}
            categoriesLoading={categoriesLoading}
          />
        </div>
      </div>
    </div>
  );
}

function AdminTabContent({
  activeTab,
  statsLoading,
  stats,
  alterationsLoading,
  eventsLoading,
  alterations,
  events,
  productsLoading,
  products,
  ordersLoading,
  orders,
  customersLoading,
  customers,
  promotionsLoading,
  promotions,
  contactLoading,
  contact,
  categories,
  categoriesLoading,
}: {
  activeTab: string;
  statsLoading: boolean;
  stats: any;
  alterationsLoading: boolean;
  eventsLoading: boolean;
  alterations: any;
  events: any;
  productsLoading: boolean;
  products: any;
  ordersLoading: boolean;
  orders: any;
  customersLoading: boolean;
  customers: any;
  promotionsLoading: boolean;
  promotions: any;
  contactLoading: boolean;
  contact: any;
  categories: any;
  categoriesLoading: boolean;
}) {
  switch (activeTab) {
    case "dashboard": {
      return statsLoading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardStats stats={stats} />
      );
    }
    case "calendar": {
      return alterationsLoading || eventsLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : (
        <CalendarAdmin alterations={alterations} events={events} />
      );
    }
    case "products": {
      return productsLoading || categoriesLoading ? (
        <ProductsSkeleton />
      ) : (
        <ProductsAdmin products={products} categories={categories} />
      );
    }
    case "categories": {
      return categoriesLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : (
        <CategoriesAdmin categories={categories} />
      );
    }
    case "orders": {
      return ordersLoading ? (
        <OrdersSkeleton />
      ) : (
        <OrdersAdmin orders={orders} />
      );
    }
    case "events": {
      return eventsLoading ? (
        <EventsSkeleton />
      ) : (
        <EventsAdmin events={events} />
      );
    }
    case "alterations": {
      return alterationsLoading ? (
        <AlterationsSkeleton />
      ) : (
        <AlterationsAdmin alterations={alterations} customers={customers} />
      );
    }
    case "customers": {
      return customersLoading ? (
        <CustomersSkeleton />
      ) : (
        <CustomersAdmin customers={customers} />
      );
    }
    case "promotions": {
      return promotionsLoading ? (
        <PromotionsSkeleton />
      ) : (
        <PromotionsAdmin promotions={promotions} />
      );
    }
    case "settings": {
      return contactLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : (
        <SettingsAdmin contact={contact} />
      );
    }
    default: {
      return null;
    }
  }
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
    { icon: Package, label: "Products Available", value: stats.totalProducts },
    { icon: Calendar, label: "Active Workshops", value: stats.activeEvents },
    { icon: ShoppingCart, label: "Pending Orders", value: stats.pendingOrders },
    {
      icon: Scissors,
      label: "Pending Alterations",
      value: stats.pendingAlterations,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-light text-foreground pb-2 border-b border-gold/10">
        Fulfillment Statistics
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-6 rounded-xl border border-gold/10 bg-card space-y-3 hover:border-gold/20 transition-all duration-200"
          >
            <card.icon className="h-5 w-5 text-gold" />
            <div>
              <p className="text-3xl font-light text-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>
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

function CustomersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      <div className="rounded-xl border border-gold/10 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin({
  products,
  categories,
}: {
  products: Awaited<ReturnType<typeof adminGetProducts>>;
  categories: any[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { url: string; file?: File }[]
  >([]);
  const [formData, setFormData] = useState({
    brand: "",
    categoryId: "",
    colors: "", // New Colors Tag input
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
      categoryId: "",
      colors: "",
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

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      brand: product.brand ?? "",
      categoryId: product.categoryId ?? "",
      colors: product.colors ? JSON.parse(product.colors).join(", ") : "",
      condition: product.condition as any,
      description: product.description ?? "",
      featured: product.featured,
      gender: product.gender as any,
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
      product.images?.map((i: any) => ({ file: undefined, url: i.url })) ?? []
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
    const img = pendingImages[index];
    if (!img) {
      return;
    }
    if (editingProduct && !img.file) {
      try {
        const fullImgObj = editingProduct.images?.find(
          (i: any) => i.url === img.url
        );
        if (fullImgObj) {
          await adminDeleteProductImage({ data: fullImgObj.id });
        }
      } catch {
        toast.error("Failed to delete remote image");
      }
    }
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = async (index: number) => {
    const img = pendingImages[index];
    if (!img) {
      return;
    }
    if (editingProduct && !img.file) {
      try {
        const fullImgObj = editingProduct.images?.find(
          (i: any) => i.url === img.url
        );
        if (fullImgObj) {
          await adminSetPrimaryImage({
            data: { imageId: fullImgObj.id, productId: editingProduct.id },
          });
          toast.success("Primary image updated");
        }
      } catch {
        toast.error("Failed to set primary image");
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.slug) {
      toast.error("Title, Price and Slug are required");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Category selection is required");
      return;
    }

    const sizes = formData.sizes
      ? formData.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const colors = formData.colors
      ? formData.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

    // Automatic SKU generation logic if not provided
    const sku =
      formData.sku ||
      `RLX-${formData.gender.toUpperCase()}-${formData.condition.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const imageUrls = pendingImages.map((img) => img.url);

    try {
      if (editingProduct) {
        await adminUpdateProduct({
          data: {
            brand: formData.brand || null,
            categoryId: formData.categoryId || null,
            colors,
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
            sku,
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

        toast.success("Product updated successfully");
      } else {
        await adminCreateProduct({
          data: {
            brand: formData.brand || undefined,
            categoryId: formData.categoryId,
            colors,
            condition: formData.condition,
            description: formData.description || undefined,
            featured: formData.featured,
            gender: formData.gender,
            imageUrls,
            isActive: formData.isActive,
            price: Number.parseFloat(formData.price),
            quantity: Number.parseInt(formData.quantity, 10),
            salePrice: formData.salePrice
              ? Number.parseFloat(formData.salePrice)
              : undefined,
            sizes,
            sku,
            slug: formData.slug,
            title: formData.title,
          },
        });
        toast.success(`Product created with auto SKU: ${sku}`);
      }
      setIsModalOpen(false);
      resetForm();
      await queryClient.invalidateQueries({
        queryKey: adminProductsQueryOptions().queryKey,
      });
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
      await queryClient.invalidateQueries({
        queryKey: adminProductsQueryOptions().queryKey,
      });
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">
          Products Portfolio
        </h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Product</TableHead>
              <TableHead className="text-gold">SKU</TableHead>
              <TableHead className="text-gold">Condition</TableHead>
              <TableHead className="text-gold">Price</TableHead>
              <TableHead className="text-gold">Stock</TableHead>
              <TableHead className="text-gold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="border-gold/10 hover:bg-gold/5"
              >
                <TableCell className="font-medium flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gold/5 overflow-hidden shrink-0 border border-gold/10 flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-gold" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand || "ReLUXURY Original"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {product.sku || "Auto SKU Pending"}
                </TableCell>
                <TableCell className="text-xs capitalize">
                  {product.condition.replace("_", " ")}
                </TableCell>
                <TableCell className="font-mono text-gold text-xs">
                  {product.salePrice ? (
                    <span className="space-x-1.5">
                      <span className="line-through text-muted-foreground/60">
                        ${product.price.toFixed(2)}
                      </span>
                      <span>${product.salePrice.toFixed(2)}</span>
                    </span>
                  ) : (
                    `$${product.price.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {product.quantity} items
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gold"
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
        <DialogContent className="max-w-2xl bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              {editingProduct ? "Edit Product Details" : "Create New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: editingProduct
                        ? formData.slug
                        : e.target.value
                            .toLowerCase()
                            .replaceAll(/[^a-z0-9-]/g, "-"),
                      title: e.target.value,
                    })
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
                  disabled={!!editingProduct}
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
                rows={3}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">Select Category</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
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
                <div className="flex justify-between items-center">
                  <Label>SKU</Label>
                </div>
                <Input
                  value={formData.sku}
                  placeholder="Auto generated"
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
                      condition: e.target.value as any,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
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
                      gender: e.target.value as any,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
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

            {/* Colors Input & Sizes Control */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sizes (comma-separated)</Label>
                <Input
                  value={formData.sizes}
                  placeholder="S, M, L, XL"
                  onChange={(e) =>
                    setFormData({ ...formData, sizes: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Colors (comma-separated)</Label>
                <Input
                  value={formData.colors}
                  placeholder="Black, Champagne Gold, Navy"
                  onChange={(e) =>
                    setFormData({ ...formData, colors: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>

            {/* Image Gallery uploads */}
            <div className="space-y-2">
              <Label>Product Gallery</Label>
              <div className="grid grid-cols-4 gap-3">
                {pendingImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-20 rounded border border-gold/10 bg-neutral-900 group overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gold"
                        onClick={() => handleSetPrimary(idx)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="w-full h-20 rounded border border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-all relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 text-gold animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-gold" />
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Upload
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <Label htmlFor="isActive">Show on shop public directory</Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
              />
              <Label htmlFor="featured">Feature on homepage spotlight</Label>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-gold/10 text-gold"
            >
              Reset Form
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmit}
              disabled={uploading}
            >
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoriesAdmin({ categories }: { categories: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsSaving(true);
    try {
      await adminCreateCategory({
        data: {
          description: description || undefined,
          isActive,
          name,
          sortOrder: Number.parseInt(sortOrder, 10) || 0,
        },
      });
      toast.success("Category created successfully");
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setSortOrder("0");
      setIsActive(true);
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to create category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // oxlint-disable-next-line no-alert
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await adminDeleteCategory({ data: id });
      toast.success("Category deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleLoadPresets = async () => {
    setIsSeeding(true);
    const presets = [
      {
        description: "Curated women's clothing and fashion",
        name: "Women's Apparel",
        sortOrder: 1,
      },
      {
        description: "Stylish men's clothing and fashion",
        name: "Men's Apparel",
        sortOrder: 2,
      },
      {
        description: "Designer and everyday footwear",
        name: "Shoes",
        sortOrder: 3,
      },
      {
        description: "Luxury and everyday bags",
        name: "Handbags & Purses",
        sortOrder: 4,
      },
      {
        description: "Jewelry, belts, scarves and more",
        name: "Accessories",
        sortOrder: 5,
      },
      {
        description: "Premium children's wear",
        name: "Kids Clothes",
        sortOrder: 6,
      },
      {
        description: "Authentic fine jewelry and watches",
        name: "Fine Jewelry",
        sortOrder: 7,
      },
    ];
    try {
      let count = 0;
      for (const preset of presets) {
        const exists = categories.some(
          (c) => c.name.toLowerCase() === preset.name.toLowerCase()
        );
        if (!exists) {
          await adminCreateCategory({
            data: {
              description: preset.description,
              isActive: true,
              name: preset.name,
              sortOrder: preset.sortOrder,
            },
          });
          count += 1;
        }
      }
      if (count > 0) {
        toast.success(`Successfully loaded ${count} preset categories`);
      } else {
        toast.info("All preset categories already exist");
      }
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to load presets");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-light text-foreground">
            Product Categories
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage and extend classification presets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleLoadPresets}
            variant="outline"
            disabled={isSeeding}
            className="border-gold/20 text-gold hover:bg-gold/10 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Load Presets
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gold/10 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Name</TableHead>
              <TableHead className="text-gold">Slug</TableHead>
              <TableHead className="text-gold">Description</TableHead>
              <TableHead className="text-gold">Sort Order</TableHead>
              <TableHead className="text-gold text-right">Status</TableHead>
              <TableHead className="text-gold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow
                  key={cat.id}
                  className="border-gold/5 hover:bg-gold/5 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {cat.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {cat.slug}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {cat.description || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {cat.sortOrder}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={cat.isActive ? "default" : "secondary"}
                      className={
                        cat.isActive
                          ? "bg-gold text-primary-foreground"
                          : "bg-card text-muted-foreground"
                      }
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Create New Category
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kids Clothes, Outerwear"
                className="border-gold/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of category"
                className="border-gold/10"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort Order</Label>
              <Input
                id="cat-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border-gold/10"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="cat-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="cat-active">Category is active</Label>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-gold/10 text-gold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
                disabled={isSaving}
              >
                {isSaving ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
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
          status: status as any,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: adminOrdersQueryOptions().queryKey,
      });
      toast.success("Order status updated successfully");
    } catch {
      toast.error("Failed to update order status");
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
      <h2 className="font-display text-xl text-foreground pb-2 border-b border-gold/10">
        Orders Registry
      </h2>
      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Order Number</TableHead>
              <TableHead className="text-gold">Customer</TableHead>
              <TableHead className="text-gold text-center">
                Delivery Method
              </TableHead>
              <TableHead className="text-gold text-right">
                Grand Total
              </TableHead>
              <TableHead className="text-gold text-center">Status</TableHead>
              <TableHead className="text-gold">Order Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-gold/10 hover:bg-gold/5"
              >
                <TableCell className="font-medium text-sm">
                  <Link
                    to="/admin/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="text-gold hover:underline font-mono"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{order.name}</TableCell>
                <TableCell className="text-sm text-center font-mono capitalize">
                  {order.deliveryMethod}
                </TableCell>
                <TableCell className="text-right font-mono text-gold font-semibold text-xs">
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleUpdateStatus(order.id, e.target.value)
                    }
                    className="text-xs rounded border border-gold/10 bg-background px-2 py-1 text-foreground"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
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
    if (!formData.title || !formData.startDate || !formData.slug) {
      toast.error("Title, Start Date and Slug are required");
      return;
    }
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
          price: formData.price ? Number.parseFloat(formData.price) : 0,
          slug: formData.slug,
          startDate: new Date(formData.startDate).toISOString(),
          title: formData.title,
        },
      });
      toast.success("Workshop created successfully");
      setIsModalOpen(false);
      setFormData({
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
      await queryClient.invalidateQueries({
        queryKey: adminEventsQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to create workshop");
    }
  };

  const handleDelete = async (id: string) => {
    // oxlint-disable-next-line no-alert
    if (!confirm("Are you sure you want to delete this event?")) {
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
      <div className="flex justify-between items-center pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">
          Workshops & Classes
        </h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add Workshop
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Workshop Title</TableHead>
              <TableHead className="text-gold">Start Date</TableHead>
              <TableHead className="text-gold text-center">
                Registrations
              </TableHead>
              <TableHead className="text-gold text-center">
                Instructor
              </TableHead>
              <TableHead className="text-gold text-center">Status</TableHead>
              <TableHead className="text-gold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="border-gold/10 hover:bg-gold/5"
              >
                <TableCell className="font-medium text-sm">
                  <Link
                    to="/admin/workshops/$workshopId"
                    params={{ workshopId: event.id }}
                    className="text-gold hover:underline"
                  >
                    {event.title}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">
                  {event.startDate
                    ? new Date(event.startDate).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell className="text-sm text-center font-mono">
                  {event.registrations?.length ?? 0} students
                </TableCell>
                <TableCell className="text-sm text-center">
                  {event.instructor || "—"}
                </TableCell>
                <TableCell className="text-center">
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
        <DialogContent className="max-w-xl bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Add Sewing Workshop
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value
                        .toLowerCase()
                        .replaceAll(/[^a-z0-9-]/g, "-"),
                      title: e.target.value,
                    })
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
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="border-gold/10 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="border-gold/10 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity (Students)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
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

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                placeholder="ReLUXURY Studio Maumelle"
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="border-gold/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="border-gold/10"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmit}
            >
              Create Workshop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlterationsAdmin({
  alterations,
  customers,
}: {
  alterations: Awaited<ReturnType<typeof adminGetAlterations>>;
  customers: Awaited<ReturnType<typeof adminGetCustomers>>;
}) {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualData, setManualData] = useState({
    adminNotes: "",
    itemDescription: "",
    notes: "",
    preferredDate: "",
    preferredTime: "",
    price: "",
    serviceType: "",
    status: "pending" as const,
    userId: "",
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminUpdateAlteration({
        data: {
          id,
          status: status as any,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: adminAlterationsQueryOptions().queryKey,
      });
      toast.success("Alteration updated");
    } catch {
      toast.error("Failed to update alteration status");
    }
  };

  const handleCreateManual = async () => {
    if (
      !manualData.userId ||
      !manualData.itemDescription ||
      !manualData.serviceType ||
      !manualData.preferredDate
    ) {
      toast.error("Customer, Description, Service and Date are required");
      return;
    }

    try {
      await serverAdminCreateAlteration({
        data: {
          adminNotes: manualData.adminNotes || undefined,
          itemDescription: manualData.itemDescription,
          notes: manualData.notes || undefined,
          preferredDate: new Date(manualData.preferredDate).toISOString(),
          preferredTime: manualData.preferredTime || undefined,
          price: manualData.price ? Number(manualData.price) : undefined,
          serviceType: manualData.serviceType,
          status: manualData.status,
          userId: manualData.userId,
        },
      });

      toast.success("Manual alteration ticket created successfully");
      setIsManualModalOpen(false);
      setManualData({
        adminNotes: "",
        itemDescription: "",
        notes: "",
        preferredDate: "",
        preferredTime: "",
        price: "",
        serviceType: "",
        status: "pending",
        userId: "",
      });

      await queryClient.invalidateQueries({
        queryKey: adminAlterationsQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to create manual alteration booking");
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
      <div className="flex justify-between items-center pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">
          Alteration Bookings
        </h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => setIsManualModalOpen(true)}
        >
          <Plus className="h-4 w-4" /> Book Manually
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Service Type</TableHead>
              <TableHead className="text-gold">Customer</TableHead>
              <TableHead className="text-gold">Appointment Date</TableHead>
              <TableHead className="text-gold text-right">
                Quoted Price
              </TableHead>
              <TableHead className="text-gold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alterations.map((booking) => (
              <TableRow
                key={booking.id}
                className="border-gold/10 hover:bg-gold/5"
              >
                <TableCell className="font-medium text-sm">
                  <Link
                    to="/admin/alterations/$alterationId"
                    params={{ alterationId: booking.id }}
                    className="text-gold hover:underline"
                  >
                    {booking.serviceType}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{booking.user?.name}</TableCell>
                <TableCell className="text-xs">
                  {booking.preferredDate
                    ? new Date(booking.preferredDate).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell className="text-right font-mono text-gold text-xs">
                  {booking.price === null
                    ? "Not Quoted"
                    : `$${booking.price.toFixed(2)}`}
                </TableCell>
                <TableCell className="text-center">
                  <select
                    value={booking.status}
                    onChange={(e) =>
                      handleUpdateStatus(booking.id, e.target.value)
                    }
                    className="text-xs rounded border border-gold/10 bg-background px-2 py-1 text-foreground"
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

      {/* Manual Alteration Booking Dialog */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-xl bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Manual Alteration Ticket Creator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Customer *</Label>
              <select
                value={manualData.userId}
                onChange={(e) =>
                  setManualData({ ...manualData, userId: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">-- Choose Customer --</option>
                {customers?.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} ({cust.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Input
                  value={manualData.serviceType}
                  placeholder="e.g. Jeans Hemming, Suit Alterations"
                  onChange={(e) =>
                    setManualData({
                      ...manualData,
                      serviceType: e.target.value,
                    })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Garment/Item Description *</Label>
                <Input
                  value={manualData.itemDescription}
                  placeholder="e.g. Levi's 501 Blue, Armani Charcoal Jacket"
                  onChange={(e) =>
                    setManualData({
                      ...manualData,
                      itemDescription: e.target.value,
                    })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Appointment Date *</Label>
                <Input
                  type="datetime-local"
                  value={manualData.preferredDate}
                  onChange={(e) =>
                    setManualData({
                      ...manualData,
                      preferredDate: e.target.value,
                    })
                  }
                  className="border-gold/10 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <Input
                  value={manualData.preferredTime}
                  placeholder="e.g. Morning, 2pm"
                  onChange={(e) =>
                    setManualData({
                      ...manualData,
                      preferredTime: e.target.value,
                    })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Quote ($)</Label>
                <Input
                  type="number"
                  placeholder="Set job price"
                  value={manualData.price}
                  onChange={(e) =>
                    setManualData({ ...manualData, price: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Status</Label>
                <select
                  value={manualData.status}
                  onChange={(e) =>
                    setManualData({
                      ...manualData,
                      status: e.target.value as any,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer Notes</Label>
              <Textarea
                placeholder="Requested alterations details from customer..."
                value={manualData.notes}
                onChange={(e) =>
                  setManualData({ ...manualData, notes: e.target.value })
                }
                className="border-gold/10"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Fitting & Admin Notes</Label>
              <Textarea
                placeholder="Internal measurements, fitting details, pins tracking..."
                value={manualData.adminNotes}
                onChange={(e) =>
                  setManualData({ ...manualData, adminNotes: e.target.value })
                }
                className="border-gold/10"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleCreateManual}
            >
              Book Manual Alteration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersAdmin({
  customers,
}: {
  customers: Awaited<ReturnType<typeof adminGetCustomers>>;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">
          Registered Customers
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 border-gold/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Customer</TableHead>
              <TableHead className="text-gold">Email Address</TableHead>
              <TableHead className="text-gold text-center">
                Orders Count
              </TableHead>
              <TableHead className="text-gold text-center">
                Alterations Booked
              </TableHead>
              <TableHead className="text-gold text-center">
                Workshops Attended
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((cust) => (
              <TableRow
                key={cust.id}
                className="border-gold/10 hover:bg-gold/5 cursor-pointer"
                onClick={() => setSelectedCustomer(cust)}
              >
                <TableCell className="font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-display text-gold font-bold text-xs shrink-0">
                    {cust.name.slice(0, 2).toUpperCase()}
                  </div>
                  {cust.name}
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {cust.email}
                </TableCell>
                <TableCell className="text-center font-mono text-xs">
                  {cust.orders?.length ?? 0}
                </TableCell>
                <TableCell className="text-center font-mono text-xs">
                  {cust.alterationBookings?.length ?? 0}
                </TableCell>
                <TableCell className="text-center font-mono text-xs">
                  {cust.eventRegistrations?.length ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Customer profile modal with details history */}
      {selectedCustomer && (
        <Dialog
          open={!!selectedCustomer}
          onOpenChange={() => setSelectedCustomer(null)}
        >
          <DialogContent className="max-w-4xl bg-card border border-gold/25 p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-gold/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center font-display text-gold font-bold text-base">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-gold font-display font-light text-2xl">
                    {selectedCustomer.name}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedCustomer.email}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8 pt-4">
              {/* Order History */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-light text-gold border-b border-gold/5 pb-1">
                  Orders History ({selectedCustomer.orders?.length ?? 0})
                </h3>
                {!selectedCustomer.orders ||
                selectedCustomer.orders.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No orders registered for this customer yet.
                  </p>
                ) : (
                  <div className="border border-gold/5 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-neutral-900/40">
                        <TableRow className="border-gold/5">
                          <TableHead className="text-xs text-gold">
                            Order No.
                          </TableHead>
                          <TableHead className="text-xs text-gold">
                            Delivery
                          </TableHead>
                          <TableHead className="text-xs text-gold text-right">
                            Total
                          </TableHead>
                          <TableHead className="text-xs text-gold text-center">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomer.orders.map((ord: any) => (
                          <TableRow key={ord.id} className="border-gold/5">
                            <TableCell className="font-mono text-xs text-gold">
                              <Link
                                to="/admin/orders/$orderId"
                                params={{ orderId: ord.id }}
                                className="hover:underline"
                              >
                                {ord.orderNumber}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs font-mono capitalize">
                              {ord.deliveryMethod}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono font-semibold">
                              ${ord.total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center font-mono text-[10px] capitalize">
                              <Badge variant="outline">{ord.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Alterations History */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-light text-gold border-b border-gold/5 pb-1">
                  Alteration Tickets (
                  {selectedCustomer.alterationBookings?.length ?? 0})
                </h3>
                {!selectedCustomer.alterationBookings ||
                selectedCustomer.alterationBookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No alterations booked for this customer yet.
                  </p>
                ) : (
                  <div className="border border-gold/5 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-neutral-900/40">
                        <TableRow className="border-gold/5">
                          <TableHead className="text-xs text-gold">
                            Service Type
                          </TableHead>
                          <TableHead className="text-xs text-gold">
                            Garment Description
                          </TableHead>
                          <TableHead className="text-xs text-gold">
                            Appt. Date
                          </TableHead>
                          <TableHead className="text-xs text-gold text-center">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomer.alterationBookings.map((alt: any) => (
                          <TableRow key={alt.id} className="border-gold/5">
                            <TableCell className="text-xs text-gold">
                              <Link
                                to="/admin/alterations/$alterationId"
                                params={{ alterationId: alt.id }}
                                className="hover:underline"
                              >
                                {alt.serviceType}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs">
                              {alt.itemDescription}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {new Date(alt.preferredDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-center font-mono text-[10px] capitalize">
                              <Badge variant="outline">{alt.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Workshops History */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-light text-gold border-b border-gold/5 pb-1">
                  Workshop Registrations (
                  {selectedCustomer.eventRegistrations?.length ?? 0})
                </h3>
                {!selectedCustomer.eventRegistrations ||
                selectedCustomer.eventRegistrations.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No workshop registrations found.
                  </p>
                ) : (
                  <div className="border border-gold/5 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-neutral-900/40">
                        <TableRow className="border-gold/5">
                          <TableHead className="text-xs text-gold">
                            Class Name
                          </TableHead>
                          <TableHead className="text-xs text-gold">
                            Payment
                          </TableHead>
                          <TableHead className="text-xs text-gold text-center">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomer.eventRegistrations.map((reg: any) => (
                          <TableRow key={reg.id} className="border-gold/5">
                            <TableCell className="text-xs text-gold">
                              <Link
                                to="/admin/workshops/$workshopId"
                                params={{ workshopId: reg.event.id }}
                                className="hover:underline"
                              >
                                {reg.event.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs capitalize font-mono">
                              {reg.paymentStatus}
                            </TableCell>
                            <TableCell className="text-center font-mono text-[10px] capitalize">
                              <Badge variant="outline">{reg.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                className="border-gold/10 text-gold"
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
              >
                Close Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
    sortOrder: "0",
    subtitle: "",
    title: "",
  });

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }
    try {
      await adminCreatePromotion({
        data: {
          buttonLink: formData.buttonLink || undefined,
          buttonText: formData.buttonText || undefined,
          description: formData.description || undefined,
          displayLocation: formData.displayLocation,
          imageUrl: formData.imageUrl || undefined,
          sortOrder: Number.parseInt(formData.sortOrder, 10) || 0,
          subtitle: formData.subtitle || undefined,
          title: formData.title,
        },
      });
      toast.success("Promotion created");
      setIsModalOpen(false);
      setFormData({
        buttonLink: "",
        buttonText: "",
        description: "",
        displayLocation: "both",
        imageUrl: "",
        sortOrder: "0",
        subtitle: "",
        title: "",
      });
      await queryClient.invalidateQueries({
        queryKey: adminPromotionsQueryOptions().queryKey,
      });
    } catch {
      toast.error("Failed to create promotion");
    }
  };

  const handleDelete = async (id: string) => {
    // oxlint-disable-next-line no-alert
    if (!confirm("Are you sure you want to delete this promotion?")) {
      return;
    }
    try {
      await adminDeletePromotion({ data: id });
      await queryClient.invalidateQueries({
        queryKey: adminPromotionsQueryOptions().queryKey,
      });
      toast.success("Promotion deleted");
    } catch {
      toast.error("Failed to delete promotion");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">
          Marketing & Spotlight Banners
        </h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Promotion Banner</TableHead>
              <TableHead className="text-gold text-center">
                Display Location
              </TableHead>
              <TableHead className="text-gold text-center">
                Priority Order
              </TableHead>
              <TableHead className="text-gold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promo) => (
              <TableRow
                key={promo.id}
                className="border-gold/10 hover:bg-gold/5"
              >
                <TableCell className="font-medium text-sm">
                  <div>
                    <p>{promo.title}</p>
                    {promo.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {promo.subtitle}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-center font-mono capitalize">
                  {promo.displayLocation}
                </TableCell>
                <TableCell className="text-sm text-center font-mono">
                  {promo.sortOrder}
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
        <DialogContent className="max-w-md bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Add Spotlight Promotion Banner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banner Title *</Label>
              <Input
                value={formData.title}
                placeholder="e.g. Summer Collection Arrivals!"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-gold/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle / Description</Label>
              <Input
                value={formData.subtitle}
                placeholder="e.g. Get 20% off all pre-loved items this week."
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                className="border-gold/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Location</Label>
                <select
                  value={formData.displayLocation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayLocation: e.target.value as any,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="both">Both Homepage & Shop</option>
                  <option value="homepage">Homepage Only</option>
                  <option value="shop">Shop Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={formData.buttonText}
                  placeholder="e.g. Shop Now"
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
                  placeholder="e.g. /shop"
                  onChange={(e) =>
                    setFormData({ ...formData, buttonLink: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmit}
            >
              Add Promotion Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsAdmin({ contact }: { contact: any }) {
  const [address, setAddress] = useState(contact?.address || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [hours, setHours] = useState(contact?.hours || "");

  const updateMutation = useMutation({
    mutationFn: adminUpdateFooterContact,
    onError: (err) => {
      toast.error(err.message || "Failed to update contact settings");
    },
    onSuccess: () => {
      toast.success("Boutique contact information updated successfully!");
      queryClient.invalidateQueries({
        queryKey: footerContactQueryOptions().queryKey,
      });
    },
  });

  const handleSaveSettings = () => {
    if (!address || !phone || !hours) {
      toast.error("All settings fields are required");
      return;
    }
    updateMutation.mutate({ address, hours, phone });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-foreground pb-2 border-b border-gold/10">
        Boutique Settings
      </h2>

      <div className="max-w-2xl bg-card border border-gold/10 rounded-xl p-6 space-y-6">
        <h3 className="font-display text-lg font-light text-gold flex items-center gap-2">
          <Settings className="h-5 w-5 text-gold" /> Footer Contact Information
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Store Address</Label>
            <Textarea
              value={address}
              onChange={(e: any) => setAddress(e.target.value)}
              placeholder="Store Address (newline separated)"
              rows={2}
              className="border-gold/10 text-sm font-sans"
            />
          </div>

          <div className="space-y-2">
            <Label>Contact Phone Number</Label>
            <Input
              value={phone}
              onChange={(e: any) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="border-gold/10 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Opening Hours</Label>
            <Textarea
              value={hours}
              onChange={(e: any) => setHours(e.target.value)}
              placeholder="Opening Hours (newline separated)"
              rows={3}
              className="border-gold/10 text-sm font-sans"
            />
          </div>
        </div>

        <Button
          className="bg-gold text-primary-foreground hover:bg-gold-dark w-full mt-4"
          onClick={handleSaveSettings}
          disabled={updateMutation.isPending}
        >
          Save Boutique Information
        </Button>
      </div>
    </div>
  );
}
