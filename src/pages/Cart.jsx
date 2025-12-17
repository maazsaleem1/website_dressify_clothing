import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { subscribeToCart } from '../services/cartService';
import './Cart.css';

function Cart() {
    const navigate = useNavigate();
    const {
        cart,
        loading,
        error,
        updateQuantity,
        removeFromCart,
        getTotalPrice,
        getTotalItems,
        getSessionId,
        reloadCart
    } = useCart();

    useEffect(() => {
        const sessionId = getSessionId();
        
        // Subscribe to real-time cart updates
        const unsubscribe = subscribeToCart(sessionId, (result) => {
            if (result.success) {
                reloadCart();
            }
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const formatCurrency = (value) => {
        if (!value) return 'Rs. 0';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) {
            if (window.confirm('Remove this item from cart?')) {
                await removeFromCart(itemId);
            }
        } else {
            await updateQuantity(itemId, newQuantity);
        }
    };

    if (loading) {
        return (
            <div className="cart-container">
                <div className="loading">Loading cart...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cart-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="cart-container">
                <div className="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p>Add some products to get started!</p>
                    <Link to="/products" className="shop-now-btn">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1 className="cart-title">Shopping Cart</h1>
            
            <div className="cart-content">
                <div className="cart-items">
                    {cart.map((item) => (
                        <div key={item.id} className="cart-item">
                            <div className="item-image">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} />
                                ) : (
                                    <div className="item-image-placeholder">No Image</div>
                                )}
                            </div>
                            
                            <div className="item-details">
                                <h3 className="item-name">{item.productName}</h3>
                                {item.sku && <p className="item-sku">SKU: {item.sku}</p>}
                                {item.size && <p className="item-size">Size: {item.size}</p>}
                                <p className="item-price">{formatCurrency(item.unitPrice)}</p>
                            </div>

                            <div className="item-quantity-controls">
                                <button
                                    className="quantity-btn"
                                    onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                >
                                    −
                                </button>
                                <span className="quantity-value">{item.quantity || 1}</span>
                                <button
                                    className="quantity-btn"
                                    onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <div className="item-total">
                                <p className="item-total-price">
                                    {formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}
                                </p>
                            </div>

                            <button
                                className="remove-btn"
                                onClick={() => {
                                    if (window.confirm('Remove this item from cart?')) {
                                        removeFromCart(item.id);
                                    }
                                }}
                                aria-label="Remove item"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h2 className="summary-title">Order Summary</h2>
                    
                    <div className="summary-row">
                        <span>Items ({getTotalItems()})</span>
                        <span>{formatCurrency(getTotalPrice())}</span>
                    </div>
                    
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span>Rs. 249</span>
                    </div>
                    
                    <div className="summary-divider"></div>
                    
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>{formatCurrency(getTotalPrice() + 249)}</span>
                    </div>

                    <button
                        className="checkout-btn"
                        onClick={() => navigate('/checkout')}
                    >
                        Proceed to Checkout
                    </button>

                    <Link to="/products" className="continue-shopping">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Cart;

