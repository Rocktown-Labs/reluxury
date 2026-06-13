export interface GuestCartItem {
  productId: string;
  quantity: number;
  size: string | null;
}

const STORAGE_KEY = "reluxury-guest-cart";

function read(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(cart: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("reluxury-cart-changed"));
}

export function getGuestCart(): GuestCartItem[] {
  return read();
}

export function getGuestCartCount(): number {
  let count = 0;
  for (const item of read()) {
    count += item.quantity;
  }
  return count;
}

export function addToGuestCart(data: {
  productId: string;
  quantity: number;
  size: string | null;
}): void {
  const cart = read();
  const existing = cart.find(
    (item) => item.productId === data.productId && item.size === data.size
  );
  if (existing) {
    existing.quantity += data.quantity;
  } else {
    cart.push({ ...data });
  }
  write(cart);
}

export function updateGuestCartItem(
  productId: string,
  size: string | null,
  quantity: number
): void {
  const cart = read();
  const idx = cart.findIndex(
    (item) => item.productId === productId && item.size === size
  );
  if (idx === -1) {
    return;
  }
  if (quantity <= 0) {
    cart.splice(idx, 1);
  } else {
    cart[idx].quantity = quantity;
  }
  write(cart);
}

export function removeFromGuestCart(
  productId: string,
  size: string | null
): void {
  const cart = read();
  const idx = cart.findIndex(
    (item) => item.productId === productId && item.size === size
  );
  if (idx !== -1) {
    cart.splice(idx, 1);
    write(cart);
  }
}

export function clearGuestCart(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("reluxury-cart-changed"));
}
