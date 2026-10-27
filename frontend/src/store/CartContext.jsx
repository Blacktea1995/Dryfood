import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const KEY = 'df_cart';

function readCart() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch { /* ignore */ }
  }, [items]);

  function addItem(product, quantity = 1) {
    setItems(prev => {
      const found = prev.find(i => i.productId === product.id);
      const next = found
        ? prev.map(i =>
            i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              unit: product.unit || 'goi',
              imageUrl: product.imageUrl || '',
              stock: product.stock,
              quantity
            }
          ];
      return next;
    });
    // Toast payload for the storefront "added to cart" confirmation
    setLastAdded({ name: product.name, at: Date.now() });
  }

  const [lastAdded, setLastAdded] = useState(null);
  function clearLastAdded() {
    setLastAdded(null);
  }

  // Auto-dismiss the "added to cart" toast so it never blocks the UI
  // (especially on mobile, where a persistent toast would cover the FABs).
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(clearLastAdded, 3500);
    return () => clearTimeout(t);
  }, [lastAdded]);

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    ));
  }

  function removeItem(productId) {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, updateQuantity, removeItem, clearCart, lastAdded, clearLastAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
