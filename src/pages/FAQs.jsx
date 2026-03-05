import './StaticPage.css';

function FAQs() {
    return (
        <div className="static-page">
            <div className="static-page-container">
                <h1 className="static-page-title">FAQs</h1>
                <div className="static-page-content">
                    <h2 className="static-page-h2">Shipping & Delivery</h2>
                    <p><strong>How long does shipping take?</strong><br />Orders are typically delivered within 5–7 business days. You will receive tracking information once your order ships.</p>
                    <p><strong>Do you offer free shipping?</strong><br />Yes. We offer free shipping on orders over Rs. 2,999.</p>

                    <h2 className="static-page-h2">Returns & Exchanges</h2>
                    <p><strong>What is your return policy?</strong><br />We offer free returns within 30 days of delivery. Items must be unworn and in original condition with tags attached.</p>

                    <h2 className="static-page-h2">Orders & Payment</h2>
                    <p><strong>What payment methods do you accept?</strong><br />We accept Cash on Delivery (COD) and EasyPaisa. Payment details are confirmed at checkout.</p>
                </div>
            </div>
        </div>
    );
}

export default FAQs;
