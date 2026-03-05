import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './CartDrawer.css';

const SHIPPING = 249;

function CartDrawer({ isOpen, onClose }) {
    const navigate = useNavigate();
    const {
        cart,
        loading,
        updateQuantity,
        removeFromCart,
        getTotalPrice,
        getTotalItems
    } = useCart();

    const formatCurrency = (value) => {
        if (!value) return 'Rs. 0';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) {
            await removeFromCart(itemId);
        } else {
            await updateQuantity(itemId, newQuantity);
        }
    };

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        onClose();
    };

    const subtotal = getTotalPrice();
    const total = subtotal + SHIPPING;
    const totalItems = getTotalItems();

    if (!isOpen) return null;

    return (
        <>
            <div className="cart-drawer-overlay" onClick={onClose} aria-hidden="true" />
            <aside className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`} role="dialog" aria-label="Shopping cart">
                <div className="cart-drawer-inner">
                    <header className="cart-drawer-header">
                        <h2 className="cart-drawer-title">YOUR CART ({totalItems})</h2>
                        <button
                            type="button"
                            className="cart-drawer-close"
                            onClick={onClose}
                            aria-label="Close cart"
                        >
                            ×
                        </button>
                    </header>

                    <div className="cart-drawer-body">
                        {loading ? (
                            <div className="cart-drawer-loading">Loading cart...</div>
                        ) : cart.length === 0 ? (
                            <div className="cart-drawer-empty">
                                <p>Your cart is empty</p>
                                <button type="button" className="cart-drawer-btn-continue" onClick={handleContinueShopping}>
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            <>
                                <ul className="cart-drawer-items">
                                    {cart.map((item) => (
                                        <li key={item.id} className="cart-drawer-item">
                                            <div className="cart-drawer-item-image">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.productName || ''} />
                                                ) : (
                                                    <div className="cart-drawer-item-placeholder">No Image</div>
                                                )}
                                            </div>
                                            <div className="cart-drawer-item-info">
                                                <h3 className="cart-drawer-item-name">{item.productName || 'Product'}</h3>
                                                {item.sku && <p className="cart-drawer-item-sku">SKU: {item.sku}</p>}
                                                {item.size && <p className="cart-drawer-item-size">Size: {item.size}</p>}
                                                <p className="cart-drawer-item-price">{formatCurrency(item.unitPrice)}</p>
                                                <div className="cart-drawer-item-row">
                                                    <div className="cart-drawer-qty">
                                                        <button
                                                            type="button"
                                                            className="cart-drawer-qty-btn"
                                                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="cart-drawer-qty-value">{item.quantity || 1}</span>
                                                        <button
                                                            type="button"
                                                            className="cart-drawer-qty-btn"
                                                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="cart-drawer-item-total">
                                                        {formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="cart-drawer-remove"
                                                onClick={() => removeFromCart(item.id)}
                                                aria-label="Remove item"
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <div className="cart-drawer-summary">
                                    <h3 className="cart-drawer-summary-title">Order Summary</h3>
                                    <div className="cart-drawer-summary-row">
                                        <span>Items ({totalItems})</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="cart-drawer-summary-row">
                                        <span>Shipping</span>
                                        <span>{formatCurrency(SHIPPING)}</span>
                                    </div>
                                    <div className="cart-drawer-summary-divider" />
                                    <div className="cart-drawer-summary-row cart-drawer-summary-total">
                                        <span>Total</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                    <button type="button" className="cart-drawer-btn-checkout" onClick={handleCheckout}>
                                        PROCEED TO CHECKOUT
                                    </button>
                                    <button type="button" className="cart-drawer-btn-continue" onClick={handleContinueShopping}>
                                        Continue Shopping
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

export default CartDrawer;
