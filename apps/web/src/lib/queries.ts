import { queryOptions } from "@tanstack/react-query";

import {
  adminGetStats,
  adminGetProducts,
  adminGetOrders,
  adminGetEvents,
  adminGetAlterations,
  adminGetPromotions,
  adminGetOrderById,
  adminGetAlterationById,
  adminGetEventById,
  adminGetCustomers,
} from "@/functions/admin";
import { getCart } from "@/functions/cart";
import {
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getProducts,
  getProductBySlug,
  getProductBrands,
  getEvents,
  getEventBySlug,
  getPromotions,
  getFooterContact,
} from "@/functions/store";

export const storeKeys = {
  all: ["store"] as const,
  brands: () => [...storeKeys.all, "brands"] as const,
  categories: () => [...storeKeys.all, "categories"] as const,
  event: (slug: string) => [...storeKeys.all, "event", slug] as const,
  events: () => [...storeKeys.all, "events"] as const,
  featured: () => [...storeKeys.all, "featured"] as const,
  footerContact: () => [...storeKeys.all, "footerContact"] as const,
  newArrivals: () => [...storeKeys.all, "newArrivals"] as const,
  product: (slug: string) => [...storeKeys.all, "product", slug] as const,
  products: (filters: Record<string, unknown>) =>
    [...storeKeys.all, "products", filters] as const,
  promotions: (location?: string) =>
    [...storeKeys.all, "promotions", location ?? "all"] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  alteration: (id: string) => [...adminKeys.all, "alteration", id] as const,
  alterations: () => [...adminKeys.all, "alterations"] as const,
  customers: () => [...adminKeys.all, "customers"] as const,
  event: (id: string) => [...adminKeys.all, "event", id] as const,
  events: () => [...adminKeys.all, "events"] as const,
  order: (orderId: string) => [...adminKeys.all, "order", orderId] as const,
  orders: () => [...adminKeys.all, "orders"] as const,
  products: () => [...adminKeys.all, "products"] as const,
  promotions: () => [...adminKeys.all, "promotions"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
  items: () => [...cartKeys.all, "items"] as const,
};

export const categoriesQueryOptions = () =>
  queryOptions({
    queryFn: () => getCategories(),
    queryKey: storeKeys.categories(),
  });

export const featuredProductsQueryOptions = () =>
  queryOptions({
    queryFn: () => getFeaturedProducts(),
    queryKey: storeKeys.featured(),
  });

export const newArrivalsQueryOptions = () =>
  queryOptions({
    queryFn: () => getNewArrivals(),
    queryKey: storeKeys.newArrivals(),
  });

export const productsQueryOptions = (filters: {
  brand?: string;
  category?: string;
  condition?: string;
  gender?: string;
  page?: number;
  search?: string;
  sort?: string;
}) =>
  queryOptions({
    queryFn: () =>
      getProducts({
        data: {
          ...filters,
          limit: 12,
          page: filters.page ?? 1,
        },
      }),
    queryKey: storeKeys.products(filters),
  });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryFn: () => getProductBySlug({ data: slug }),
    queryKey: storeKeys.product(slug),
  });

export const productBrandsQueryOptions = () =>
  queryOptions({
    queryFn: () => getProductBrands(),
    queryKey: storeKeys.brands(),
  });

export const eventsQueryOptions = () =>
  queryOptions({
    queryFn: () => getEvents(),
    queryKey: storeKeys.events(),
  });

export const eventBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryFn: () => getEventBySlug({ data: slug }),
    queryKey: storeKeys.event(slug),
  });

export const promotionsQueryOptions = (location?: string) =>
  queryOptions({
    queryFn: () =>
      getPromotions({
        data: location as "homepage" | "shop" | "both" | undefined,
      }),
    queryKey: storeKeys.promotions(location),
  });

export const adminStatsQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetStats(),
    queryKey: adminKeys.stats(),
  });

export const adminProductsQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetProducts(),
    queryKey: adminKeys.products(),
  });

export const adminOrdersQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetOrders(),
    queryKey: adminKeys.orders(),
  });

export const adminEventsQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetEvents(),
    queryKey: adminKeys.events(),
  });

export const adminAlterationsQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetAlterations(),
    queryKey: adminKeys.alterations(),
  });

export const adminPromotionsQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetPromotions(),
    queryKey: adminKeys.promotions(),
  });

export const cartQueryOptions = () =>
  queryOptions({
    queryFn: () => getCart(),
    queryKey: cartKeys.items(),
  });

export const footerContactQueryOptions = () =>
  queryOptions({
    queryFn: () => getFooterContact(),
    queryKey: storeKeys.footerContact(),
  });

export const adminOrderByIdQueryOptions = (orderId: string) =>
  queryOptions({
    queryFn: () => adminGetOrderById({ data: orderId }),
    queryKey: adminKeys.order(orderId),
  });

export const adminAlterationByIdQueryOptions = (id: string) =>
  queryOptions({
    queryFn: () => adminGetAlterationById({ data: id }),
    queryKey: adminKeys.alteration(id),
  });

export const adminEventByIdQueryOptions = (id: string) =>
  queryOptions({
    queryFn: () => adminGetEventById({ data: id }),
    queryKey: adminKeys.event(id),
  });

export const adminCustomersQueryOptions = () =>
  queryOptions({
    queryFn: () => adminGetCustomers(),
    queryKey: adminKeys.customers(),
  });
