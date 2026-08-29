import { apiFetch } from "./api";

const LOCAL_CART_KEY = "trexio_cart";

/**
 * Get cached cart array from localStorage
 */
export function getStoredCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading stored cart:", err);
    return [];
  }
}

/**
 * Save cart array to localStorage and notify listeners
 */
export function setStoredCart(items) {
  if (typeof window === "undefined") return;
  try {
    const cleanItems = Array.isArray(items) ? items : [];
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cleanItems));
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: cleanItems }));
  } catch (err) {
    console.error("Error saving stored cart:", err);
  }
}

/**
 * Sync cart with backend API and fallback to localStorage if needed
 */
export async function fetchAndSyncCart() {
  let localItems = getStoredCart();
  try {
    const backendItems = await apiFetch("/cart");
    if (Array.isArray(backendItems)) {
      // If backend has items, persist to localStorage
      if (backendItems.length > 0) {
        setStoredCart(backendItems);
        return backendItems;
      } else if (localItems.length > 0) {
        // If backend returned empty list but localStorage has items (e.g. freshly added offline or before login),
        // attempt to push local items to backend
        for (const item of localItems) {
          try {
            await apiFetch("/cart", {
              method: "POST",
              body: JSON.stringify(item),
            });
          } catch (e) {
            // ignore item sync errors
          }
        }
        // re-fetch updated backend cart
        const synced = await apiFetch("/cart").catch(() => localItems);
        if (Array.isArray(synced)) {
          setStoredCart(synced);
          return synced;
        }
      }
    }
  } catch (err) {
    console.warn("Backend cart fetch failed or unauthenticated, using local cart:", err);
  }
  return localItems;
}

/**
 * Add an item to cart (backend + localStorage)
 */
export async function addItemToCart(payload) {
  const localCart = getStoredCart();
  const existingIdx = localCart.findIndex(
    (i) => i.item_id === payload.item_id || i.id === payload.item_id
  );

  let newItem = {
    id: payload.id || `cart_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    item_id: payload.item_id,
    item_type: payload.item_type || "trip",
    title: payload.title || "Item Trip",
    price: Number(payload.price || 0),
    quantity: Number(payload.quantity || 1),
    cover_image: payload.cover_image || "",
    departure_date: payload.departure_date || "",
    options: payload.options || {},
  };

  let updatedCart = [...localCart];
  if (existingIdx !== -1) {
    updatedCart[existingIdx] = {
      ...updatedCart[existingIdx],
      quantity: updatedCart[existingIdx].quantity + (payload.quantity || 1),
    };
  } else {
    updatedCart.push(newItem);
  }

  // Update local storage immediately for fast UI response
  setStoredCart(updatedCart);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cart-drawer"));
  }

  // Sync with API
  try {
    const res = await apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res && res.id) {
      // Refresh full cart from backend if available
      const fullBackend = await apiFetch("/cart").catch(() => null);
      if (Array.isArray(fullBackend)) {
        setStoredCart(fullBackend);
        return fullBackend;
      }
    }
  } catch (err) {
    console.warn("Backend add to cart skipped/failed, relying on local storage:", err);
  }

  return updatedCart;
}

/**
 * Update item quantity in cart
 */
export async function updateCartItemQuantity(cartId, quantity) {
  const localCart = getStoredCart();
  const newQty = Math.max(1, quantity);

  const updatedCart = localCart.map((item) =>
    item.id === cartId || item.item_id === cartId ? { ...item, quantity: newQty } : item
  );

  setStoredCart(updatedCart);

  try {
    await apiFetch(`/cart/${cartId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: newQty }),
    });
  } catch (err) {
    console.warn("Backend cart update failed:", err);
  }

  return updatedCart;
}

/**
 * Remove single item from cart
 */
export async function removeCartItem(cartId) {
  const localCart = getStoredCart();
  const updatedCart = localCart.filter(
    (item) => item.id !== cartId && item.item_id !== cartId
  );

  setStoredCart(updatedCart);

  try {
    await apiFetch(`/cart/${cartId}`, { method: "DELETE" });
  } catch (err) {
    console.warn("Backend cart delete failed:", err);
  }

  return updatedCart;
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  setStoredCart([]);
  try {
    await apiFetch("/cart", { method: "DELETE" });
  } catch (err) {
    console.warn("Backend cart clear failed:", err);
  }
}
