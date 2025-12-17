import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Get cart for a session
export const getCart = async (sessionId) => {
    try {
        const cartDoc = doc(db, 'carts', sessionId);
        const cartSnapshot = await getDoc(cartDoc);

        if (cartSnapshot.exists()) {
            const cartData = cartSnapshot.data();
            return {
                success: true,
                data: cartData.items || []
            };
        } else {
            // Create empty cart if it doesn't exist
            await setDoc(cartDoc, {
                sessionId,
                items: [],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return {
                success: true,
                data: []
            };
        }
    } catch (error) {
        console.error('Error getting cart:', error);
        return { success: false, error: error.message };
    }
};

// Subscribe to cart changes (real-time)
export const subscribeToCart = (sessionId, callback) => {
    const cartDoc = doc(db, 'carts', sessionId);

    return onSnapshot(cartDoc, (snapshot) => {
        if (snapshot.exists()) {
            const cartData = snapshot.data();
            callback({ success: true, data: cartData.items || [] });
        } else {
            callback({ success: true, data: [] });
        }
    }, (error) => {
        console.error('Error subscribing to cart:', error);
        callback({ success: false, error: error.message });
    });
};

// Add item to cart
export const addToCart = async (sessionId, product, size, quantity = 1) => {
    try {
        const cartDoc = doc(db, 'carts', sessionId);
        const cartSnapshot = await getDoc(cartDoc);

        let cartData;
        if (cartSnapshot.exists()) {
            cartData = cartSnapshot.data();
        } else {
            cartData = {
                sessionId,
                items: [],
                createdAt: Timestamp.now()
            };
        }

        const items = cartData.items || [];

        // Check if item already exists (same product + size)
        const existingIndex = items.findIndex(
            item => item.inventoryId === product.id && item.size === size
        );

        if (existingIndex >= 0) {
            // Update quantity if item exists
            items[existingIndex].quantity = (items[existingIndex].quantity || 0) + quantity;
        } else {
            // Add new item
            // Get image URL - prioritize imageUrl, fallback to productImages[0]
            let imageUrl = product.imageUrl || '';
            if (!imageUrl || imageUrl.trim() === '') {
                if (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0) {
                    imageUrl = product.productImages[0];
                }
            }

            const cartItem = {
                id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                inventoryId: product.id,
                productName: product.productName || 'Unnamed Product',
                sku: product.sku || '',
                size: size,
                quantity: quantity,
                unitPrice: product.onlinePrice || product.sellingPrice || 0,
                imageUrl: imageUrl, // Now includes fallback to productImages
                addedAt: Timestamp.now()
            };
            items.push(cartItem);
        }

        await setDoc(cartDoc, {
            ...cartData,
            items,
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error adding to cart:', error);
        return { success: false, error: error.message };
    }
};

// Update cart item quantity
export const updateCartItem = async (sessionId, itemId, newQuantity) => {
    try {
        const cartDoc = doc(db, 'carts', sessionId);
        const cartSnapshot = await getDoc(cartDoc);

        if (!cartSnapshot.exists()) {
            return { success: false, error: 'Cart not found' };
        }

        const cartData = cartSnapshot.data();
        const items = cartData.items || [];

        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex < 0) {
            return { success: false, error: 'Item not found in cart' };
        }

        items[itemIndex].quantity = newQuantity;
        items[itemIndex].updatedAt = Timestamp.now();

        await updateDoc(cartDoc, {
            items,
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating cart item:', error);
        return { success: false, error: error.message };
    }
};

// Remove item from cart
export const removeFromCart = async (sessionId, itemId) => {
    try {
        const cartDoc = doc(db, 'carts', sessionId);
        const cartSnapshot = await getDoc(cartDoc);

        if (!cartSnapshot.exists()) {
            return { success: false, error: 'Cart not found' };
        }

        const cartData = cartSnapshot.data();
        const items = (cartData.items || []).filter(item => item.id !== itemId);

        await updateDoc(cartDoc, {
            items,
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error removing from cart:', error);
        return { success: false, error: error.message };
    }
};

// Clear entire cart
export const clearCart = async (sessionId) => {
    try {
        const cartDoc = doc(db, 'carts', sessionId);
        await updateDoc(cartDoc, {
            items: [],
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error clearing cart:', error);
        return { success: false, error: error.message };
    }
};

// Get cart count
export const getCartCount = async (sessionId) => {
    try {
        const result = await getCart(sessionId);
        if (result.success) {
            const items = result.data || [];
            return items.reduce((total, item) => total + (item.quantity || 0), 0);
        }
        return 0;
    } catch (error) {
        console.error('Error getting cart count:', error);
        return 0;
    }
};

