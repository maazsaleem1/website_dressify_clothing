import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './CheckoutSuccess.css';

function CheckoutSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderNumber, orderId } = location.state || {};

    useEffect(() => {
        // Redirect if no order data
        if (!orderNumber) {
            navigate('/');
        }
    }, [orderNumber, navigate]);

    if (!orderNumber) {
        return null;
    }

    return (
        <div className="success-container">
            <div className="success-content">
                <div className="success-icon">✓</div>
                <h1 className="success-title">Order Placed Successfully!</h1>
                <p className="success-message">
                    Thank you for your order. We've received your order and will process it shortly.
                </p>
                
                <div className="order-info-box">
                    <p className="order-label">Order Number</p>
                    <p className="order-number">{orderNumber}</p>
                    <p className="order-note">
                        You will receive a confirmation email shortly with order details.
                    </p>
                </div>

                <div className="success-actions">
                    <Link to="/products" className="continue-shopping-btn">
                        Continue Shopping
                    </Link>
                    <button 
                        onClick={() => navigate('/')}
                        className="home-btn"
                    >
                        Go to Home
                    </button>
                </div>

                <div className="whats-next">
                    <h3>What's Next?</h3>
                    <ul>
                        <li>You will receive an order confirmation email</li>
                        <li>We'll process your order and update you on the status</li>
                        <li>Your order will be shipped within 2-4 working days</li>
                        <li>You'll receive tracking information once your order ships</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default CheckoutSuccess;

