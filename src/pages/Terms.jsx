import './StaticPage.css';

function Terms() {
    return (
        <div className="static-page">
            <div className="static-page-container">
                <h1 className="static-page-title">Terms of Service</h1>
                <div className="static-page-content">
                    <p>Welcome to Dressify. By using our website and services, you agree to these Terms of Service.</p>
                    <h2 className="static-page-h2">Use of Service</h2>
                    <p>You may use our website for lawful purposes only. You agree not to misuse our platform, attempt to gain unauthorized access, or interfere with the proper functioning of our services.</p>
                    <h2 className="static-page-h2">Orders & Purchases</h2>
                    <p>All orders are subject to availability and acceptance. We reserve the right to refuse or cancel orders. Prices and offers are subject to change without notice.</p>
                    <h2 className="static-page-h2">Intellectual Property</h2>
                    <p>All content on this site, including text, images, and logos, is the property of Dressify Clothing and is protected by applicable intellectual property laws.</p>
                    <h2 className="static-page-h2">Contact</h2>
                    <p>For questions about these terms, please contact us at support@dressify.com.</p>
                </div>
            </div>
        </div>
    );
}

export default Terms;
