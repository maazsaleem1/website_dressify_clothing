import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { CartDrawerContext } from '../contexts/CartDrawerContext';
import SearchModal from './SearchModal';
import CartDrawer from './CartDrawer';
import './Layout.css';

function Layout({ children }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter');
    const { cartCount } = useCart();

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = location.pathname === '/';
    const showHeader = !isHome;

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const cartDrawerValue = {
        openCartDrawer: () => setCartDrawerOpen(true),
        closeCartDrawer: () => setCartDrawerOpen(false)
    };

    return (
        <CartDrawerContext.Provider value={cartDrawerValue}>
            <div className="layout">
                {/* Top Bar + Header (hidden only on homepage) */}
                {showHeader && (
                    <>
                        <div className="top-bar">
                            <div className="top-bar-content top-bar-single">
                                <span className="top-bar-text">FREE SHIPPING ON ORDERS OVER RS. 2,999</span>
                            </div>
                        </div>

                        <header className="header">
                            <div className="header-content">
                                <button
                                    className="search-button"
                                    aria-label="Search"
                                    onClick={() => setSearchOpen(true)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </button>

                                <Link to="/" className="logo">
                                    <h1>DRESSIFY</h1>
                                </Link>

                                <div className="header-icons">
                                    <button className="icon-button" aria-label="Account">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </button>
                                    <button
                                        className="icon-button cart-button"
                                        aria-label="Shopping Cart"
                                        onClick={() => setCartDrawerOpen(true)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="9" cy="21" r="1"></circle>
                                            <circle cx="20" cy="21" r="1"></circle>
                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                        </svg>
                                        {cartCount > 0 && (
                                            <span className="cart-count">{cartCount}</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <nav className="header-nav-menu">
                                <Link to="/products?filter=new" className={isActive('/products') && filter === 'new' ? 'active' : ''}>NEW SP '26 COLLECTION</Link>
                                <Link to="/products?category=men" className={isActive('/products') ? 'active' : ''}>MEN</Link>
                            </nav>
                        </header>
                    </>
                )}

                {/* Cart drawer (left slider) - opens when cart icon is clicked */}
                <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

                {/* Drawer Overlay */}
                {drawerOpen && (
                    <div className="drawer-overlay" onClick={closeDrawer}></div>
                )}

                {/* Sidebar Drawer */}
                <aside className={`drawer ${drawerOpen ? 'open' : ''}`}>
                    <div className="drawer-header">
                        <h2>Menu</h2>
                        <button className="close-button" onClick={closeDrawer} aria-label="Close menu">
                            ×
                        </button>
                    </div>

                    <nav className="drawer-nav">
                        <Link to="/" className={`drawer-link ${isActive('/') ? 'active' : ''}`} onClick={closeDrawer}>
                            <span>🏠</span> Home
                        </Link>
                        <Link to="/products" className={`drawer-link ${isActive('/products') ? 'active' : ''}`} onClick={closeDrawer}>
                            <span>🛍️</span> All Products
                        </Link>
                        <Link to="/categories" className={`drawer-link ${isActive('/categories') ? 'active' : ''}`} onClick={closeDrawer}>
                            <span>📂</span> Categories
                        </Link>
                        <div className="drawer-divider"></div>
                        <div className="drawer-section-title">Quick Links</div>
                        <Link to="/products?filter=low-stock" className="drawer-link" onClick={closeDrawer}>
                            <span>⚠️</span> Low Stock Items
                        </Link>
                        <Link to="/products?filter=new" className="drawer-link" onClick={closeDrawer}>
                            <span>🆕</span> New Arrivals
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {children}
                </main>

                {/* Footer */}
                <footer className="footer">
                    <div className="footer-blur-section"></div>
                    <div className="footer-content">
                        <div className="footer-columns">
                            <div className="footer-column">
                                <h3 className="footer-column-title">OUR COMPANY</h3>
                                <ul className="footer-links">
                                    <li><Link to="/about">ABOUT US</Link></li>
                                    <li><Link to="/contact">CONTACT US</Link></li>
                                    <li><Link to="/blogs">BLOGS</Link></li>
                                    <li><Link to="/faqs">FAQS</Link></li>
                                    <li><Link to="/terms">TERMS OF SERVICE</Link></li>
                                </ul>
                            </div>

                            <div className="footer-column">
                                <h3 className="footer-column-title">POLICIES</h3>
                                <ul className="footer-links">
                                    <li><Link to="/shipping">SHIPPING & HANDLING</Link></li>
                                    <li><Link to="/exchange">EXCHANGE POLICY</Link></li>
                                    <li><Link to="/privacy">PRIVACY POLICY</Link></li>
                                </ul>
                            </div>

                            <div className="footer-column">
                                <h3 className="footer-column-title">GET IN TOUCH</h3>
                                <ul className="footer-contact">
                                    <li>• PHONE</li>
                                    <li>+92 3343092263</li>
                                    <li>• EMAIL</li>
                                    <li>support@dressify.com</li>
                                </ul>
                            </div>

                            <div className="footer-column">
                                <h3 className="footer-column-title">NEWSLETTER</h3>
                                <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }}>
                                    <input
                                        type="email"
                                        placeholder="Your email"
                                        className="newsletter-input"
                                        required
                                    />
                                    <button type="submit" className="newsletter-button">SUBSCRIBE</button>
                                </form>
                                <div className="footer-social">
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </a>
                                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="footer-bottom">
                            <p className="footer-copyright">
                                Copyright © 2025, Dressify Clothing. All rights reserved. See our <Link to="/terms">terms of use</Link> and <Link to="/privacy">privacy notice</Link>.
                            </p>
                            <p className="footer-powered">Powered by Dressify</p>
                        </div>
                    </div>

                    {/* Scroll to Top Button */}
                    <button
                        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label="Scroll to top"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 15l-6-6-6 6" />
                        </svg>
                    </button>
                </footer>

                {/* Floating WhatsApp Button */}
                <a
                    href="https://wa.me/923343092263"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-float"
                    aria-label="Contact us on WhatsApp"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                </a>
            </div>
        </CartDrawerContext.Provider>
    );
}

export default Layout;

