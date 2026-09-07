import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CartItem, Product } from '../types.js';
import { useAuth } from './AuthContext.js';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  minimumRequired: number;
  remainingToMinimum: number;
  isMinimumReached: boolean;
  progressPercentage: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'balbec_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { franchisee } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        // Prepopulate with a couple of items to demonstrate the minimum goal tracker right away
        setItems([
          {
            product: {
              id: 'prod-1',
              name: 'Coxinha Especial de Frango c/ Catupiry (100g)',
              description: 'Massa de batata crocante recheada com peito de frango desfiado temperado e requeijão Catupiry original.',
              categoryId: 'cat-1',
              price: 6.50,
              imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
              internalCode: 'SLG-101',
              status: 'active',
              createdAt: new Date().toISOString(),
            },
            quantity: 50,
          },
          {
            product: {
              id: 'prod-5',
              name: 'Esfiha Fechada de Carne Temperada (120g)',
              description: 'Massa folhada macia recheada com carne moída, cebola, tomate e especiarias sírias.',
              categoryId: 'cat-2',
              price: 7.00,
              imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
              internalCode: 'ASD-201',
              status: 'active',
              createdAt: new Date().toISOString(),
            },
            quantity: 15,
          },
        ]);
      }
    } catch {
      // fallback
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      } else {
        return [...prev, { product, quantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  // Franchisee-specific minimum order value
  const minimumRequired = franchisee ? franchisee.minimumOrderValue : 300;

  const remainingToMinimum = Math.max(0, minimumRequired - subtotal);
  const isMinimumReached = subtotal >= minimumRequired;
  const progressPercentage = Math.min(100, Math.round((subtotal / minimumRequired) * 100));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        minimumRequired,
        remainingToMinimum,
        isMinimumReached,
        progressPercentage,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
