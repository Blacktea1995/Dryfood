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
      if (found) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
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
    });
  }

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
    <CartContext.Provider value={{ items, count, total, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
