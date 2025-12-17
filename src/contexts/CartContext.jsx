import { createContext, useContext, useState, useEffect } from 'react';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
} from '../services/cartService';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get or create session ID
    const getSessionId = () => {
        let sessionId = localStorage.getItem('cartSessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('cartSessionId', sessionId);
        }
        return sessionId;
    };

    // Load cart on mount
    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const sessionId = getSessionId();
            const result = await getCart(sessionId);

            if (result.success) {
                const items = result.data || [];
                setCart(items);
                // Calculate total items count
                const totalItems = items.reduce((total, item) => total + (parseInt(item.quantity || 0)), 0);
                setCartCount(totalItems);
                setError(null);
            } else {
                setError(result.error);
                setCart([]);
                setCartCount(0);
            }
        } catch (err) {
            console.error('Error loading cart:', err);
            setError('Failed to load cart');
            setCart([]);
            setCartCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (product, size, quantity = 1) => {
        try {
            const sessionId = getSessionId();
            const result = await addToCart(sessionId, product, size, quantity);

            if (result.success) {
                await loadCart(); // Reload cart to get updated data
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            return { success: false, error: 'Failed to add to cart' };
        }
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            if (newQuantity <= 0) {
                return await handleRemoveFromCart(itemId);
            }

            const sessionId = getSessionId();
            const result = await updateCartItem(sessionId, itemId, newQuantity);

            if (result.success) {
                await loadCart();
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err) {
            console.error('Error updating cart:', err);
            return { success: false, error: 'Failed to update cart' };
        }
    };

    const handleRemoveFromCart = async (itemId) => {
        try {
            const sessionId = getSessionId();
            const result = await removeFromCart(sessionId, itemId);

            if (result.success) {
                await loadCart();
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err) {
            console.error('Error removing from cart:', err);
            return { success: false, error: 'Failed to remove from cart' };
        }
    };

    const handleClearCart = async () => {
        try {
            const sessionId = getSessionId();
            const result = await clearCart(sessionId);

            if (result.success) {
                setCart([]);
                setCartCount(0);
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err) {
            console.error('Error clearing cart:', err);
            return { success: false, error: 'Failed to clear cart' };
        }
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => {
            const price = parseFloat(item.unitPrice || 0);
            const quantity = parseInt(item.quantity || 0);
            return total + (price * quantity);
        }, 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => {
            return total + parseInt(item.quantity || 0);
        }, 0);
    };

    const value = {
        cart,
        cartCount: getTotalItems(),
        loading,
        error,
        addToCart: handleAddToCart,
        updateQuantity: handleUpdateQuantity,
        removeFromCart: handleRemoveFromCart,
        clearCart: handleClearCart,
        reloadCart: loadCart,
        getTotalPrice,
        getTotalItems,
        getSessionId
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

