import './StaticPage.css';

function Contact() {
    return (
        <div className="static-page">
            <div className="static-page-container">
                <h1 className="static-page-title">Contact Us</h1>
                <div className="static-page-content">
                    <p>We'd love to hear from you. Get in touch with our team for any questions, feedback, or support.</p>
                    <div className="static-page-contact-block">
                        <p><strong>Phone</strong><br />+92 3343092263</p>
                        <p><strong>Email</strong><br />support@dressify.com</p>
                    </div>
                    <p>Our support team typically responds within 24 hours. For urgent matters, you can also reach us via WhatsApp using the button on our site.</p>
                </div>
            </div>
        </div>
    );
}

export default Contact;
