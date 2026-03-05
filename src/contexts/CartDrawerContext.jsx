import { createContext, useContext } from 'react';

const CartDrawerContext = createContext(null);

export function useCartDrawer() {
    const ctx = useContext(CartDrawerContext);
    if (!ctx) return { openCartDrawer: () => {}, closeCartDrawer: () => {} };
    return ctx;
}

export { CartDrawerContext };
