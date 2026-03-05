import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCartDrawer } from '../contexts/CartDrawerContext';
import { createOrder } from '../services/orderService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { useToast } from '../contexts/ToastContext';
import './Checkout.css';

function Checkout() {
    const navigate = useNavigate();
    const { cart, getTotalPrice, clearCart, getSessionId } = useCart();
    const { openCartDrawer } = useCartDrawer();
    const { success: showSuccess, error: showError } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const formatCurrency = (value) => {
        if (!value) return 'Rs. 0';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email');
            return false;
        }
        if (!formData.phone.trim()) {
            setError('Please enter your phone number');
            return false;
        }
        if (!formData.address.trim()) {
            setError('Please enter your shipping address');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        if (cart.length === 0) {
            setError('Your cart is empty');
            return;
        }

        setSubmitting(true);

        try {
            const paymentInfo = {
                method: paymentMethod === 'cod' ? 'Cash on Delivery' : 'EasyPaisa',
                status: paymentMethod === 'cod' ? 'Pending' : 'Pending'
            };

            const result = await createOrder(cart, formData, paymentInfo);

            if (result.success) {
                // Calculate costs for email
                const subtotal = getTotalPrice();
                const shipping = 249; // Fixed shipping cost
                const tax = 0; // No tax for now, adjust if needed
                const total = subtotal + shipping + tax;

                const costs = {
                    shipping: shipping,
                    tax: tax,
                    total: total
                };

                // Send order confirmation email
                try {
                    const emailResult = await sendOrderConfirmationEmail(
                        result.data,
                        cart,
                        costs,
                        formData.email
                    );

                    if (emailResult.success) {
                        showSuccess('Order confirmation email sent!');
                    } else {
                        // Don't fail the order if email fails, just log it
                        console.warn('Email sending failed:', emailResult.error);
                        showError('Order placed but email could not be sent. Please check your email.');
                    }
                } catch (emailError) {
                    // Don't fail the order if email fails
                    console.error('Email error:', emailError);
                }

                // Clear cart after successful order
                await clearCart();

                // Navigate to success page with order details
                navigate('/checkout/success', {
                    state: {
                        orderNumber: result.data.orderNumber,
                        orderId: result.data.id
                    }
                });
            } else {
                setError(result.error || 'Failed to create order. Please try again.');
                showError(result.error || 'Failed to create order. Please try again.');
            }
        } catch (err) {
            console.error('Error creating order:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="checkout-page">
                <div className="checkout-container checkout-empty">
                    <div className="empty-cart-message">
                        <h2>Your cart is empty</h2>
                        <p>Add items to your cart to proceed to checkout.</p>
                        <button type="button" onClick={() => navigate('/products')} className="shop-btn">
                            Continue shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = getTotalPrice();
    const shipping = 249;
    const total = subtotal + shipping;

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <header className="checkout-header">
                    <button type="button" className="checkout-back" onClick={openCartDrawer}>← Back to cart</button>
                    <h1 className="checkout-title">Checkout</h1>
                    <p className="checkout-subtitle">Complete your order securely</p>
                </header>

                <div className="checkout-content">
                    <form className="checkout-form" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h2 className="section-title">Contact information</h2>

                            <div className="form-row form-row-two">
                                <div className="form-group">
                                    <label htmlFor="name">Full name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="+92 300 1234567"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h2 className="section-title">Shipping address</h2>

                            <div className="form-group">
                                <label htmlFor="address">Street address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    placeholder="House number, street, area, city"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes">Order notes <span className="label-optional">(optional)</span></label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="2"
                                    placeholder="Delivery instructions or special requests"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h2 className="section-title">Payment method</h2>

                            <div className="payment-options">
                                <label className="payment-option">
                                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <span className="payment-option-box"></span>
                                    <div className="payment-option-content">
                                        <span className="payment-name">Cash on Delivery</span>
                                        <span className="payment-desc">Pay when you receive your order</span>
                                    </div>
                                </label>
                                <label className="payment-option">
                                    <input type="radio" name="paymentMethod" value="easypaisa" checked={paymentMethod === 'easypaisa'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <span className="payment-option-box"></span>
                                    <div className="payment-option-content">
                                        <span className="payment-name">EasyPaisa</span>
                                        <span className="payment-desc">Payment details sent after order confirmation</span>
                                    </div>
                                </label>
                            </div>

                            {paymentMethod === 'easypaisa' && (
                                <div className="payment-info">
                                    <p>After placing your order, you will receive payment details via email or SMS. Complete payment within 24 hours to confirm.</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="checkout-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button type="submit" className="submit-order-btn" disabled={submitting}>
                            {submitting ? 'Placing order…' : 'Place order'}
                        </button>
                    </form>

                    <aside className="checkout-summary">
                        <h2 className="summary-title">Order summary</h2>

                    <div className="order-items-preview">
                        {cart.map((item) => (
                            <div key={item.id} className="preview-item">
                                <div className="preview-item-image">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.productName} />
                                    ) : (
                                        <div className="preview-placeholder">No Image</div>
                                    )}
                                </div>
                                <div className="preview-item-details">
                                    <p className="preview-item-name">{item.productName}</p>
                                    {item.size && <p className="preview-item-size">Size: {item.size}</p>}
                                    <p className="preview-item-quantity">Qty: {item.quantity}</p>
                                </div>
                                <p className="preview-item-price">
                                    {formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}
                                </p>
                            </div>
                        ))}
                    </div>

                        <div className="summary-breakdown">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>{formatCurrency(shipping)}</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row summary-total">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default Checkout;

