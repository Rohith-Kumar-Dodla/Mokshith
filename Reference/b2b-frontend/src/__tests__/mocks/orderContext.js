import React from 'react';
import { vi } from 'vitest';

// Mock useOrder hook
export const mockUseOrder = vi.fn();

export const OrderContext = React.createContext({
  cart: [],
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  cartTotal: 0,
});

export const MockOrderProvider = ({ children, value = {} }) => {
  const defaultValue = {
    cart: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    cartTotal: 0,
    ...value,
  };

  return <OrderContext.Provider value={defaultValue}>{children}</OrderContext.Provider>;
};

export const useOrder = () => React.useContext(OrderContext);

export const mockOrderContext = (cart = []) => ({
  cart,
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  cartTotal: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
});
