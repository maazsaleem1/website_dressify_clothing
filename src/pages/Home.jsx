import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import HomepageSlider from '../components/HomepageSlider';
import ProductSkeleton from '../components/ProductSkeleton';
import LazyImage from '../components/LazyImage';
import './Home.css';

function Home() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                const inventoryCollection = collection(db, 'inventory');
                const q = query(inventoryCollection, orderBy('createdAt', 'desc'), limit(20));
                const snapshot = await getDocs(q);
                let products = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Filter only online products that are not hidden, and limit to 8
                // Only show products where onlineStatus === true (explicitly set to true)
                products = products
                    .filter(product => {
                        // Check if product is online - must be explicitly true
                        const isOnline = product.onlineStatus === true;

                        // Check if product is hidden
                        const status = (product.status || '').toLowerCase();
                        const isHidden = status === 'hidden' || status === 'hide';

                        // Also check for a dedicated hidden field
                        const hasHiddenField = product.hidden === true || product.hide === true;

                        return isOnline && !isHidden && !hasHiddenField;
                    })
                    .slice(0, 8);

                setFeaturedProducts(products);
            } catch (error) {
                console.error('Error fetching featured products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);

    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    const getProductPrice = (product) => {
        return product.onlinePrice || product.sellingPrice;
    };

    if (loading) {
        return (
            <div className="home-container">
                <HomepageSlider />
                <section className="brand-slogan-section">
                    <h2 className="brand-slogan-logo">Dressify</h2>
                    <p className="brand-slogan-tagline">Moments To Memories</p>
                    <p className="brand-slogan-text">When spring begins, normal days turn into something more.</p>
                    <Link to="/products?category=men" className="brand-slogan-cta">SHOP MEN</Link>
                </section>
                <section className="new-arrivals-section">
                    <div className="products-grid">
                        <ProductSkeleton count={8} />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Firebase-Driven Homepage Slider */}
            <HomepageSlider />

            {/* Brand Slogan Section - after banner */}
            <section className="brand-slogan-section">
                <h2 className="brand-slogan-logo">Dressify</h2>
                <p className="brand-slogan-tagline">Moments To Memories</p>
                <p className="brand-slogan-text">When spring begins, normal days turn into something more.</p>
                <Link to="/products?category=men" className="brand-slogan-cta">SHOP MEN</Link>
            </section>

            {/* Products under slogan */}
            <section className="new-arrivals-section">
                {featuredProducts.length === 0 ? (
                    <div className="no-products">No products available at the moment.</div>
                ) : (
                    <div className="products-grid">
                        {featuredProducts.map((product) => {
                            // Get primary image - use imageUrl first, fallback to productImages[0]
                            const primaryImage = product.imageUrl && product.imageUrl.trim() !== ''
                                ? product.imageUrl
                                : (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0
                                    ? product.productImages[0]
                                    : null);

                            // Get hover image (second image from productImages array if available)
                            const hoverImage = product.productImages && Array.isArray(product.productImages) && product.productImages.length > 1
                                ? product.productImages[1]
                                : (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0 && primaryImage !== product.productImages[0]
                                    ? product.productImages[0]
                                    : null);

                            // Check for "New" or "Sale" badges
                            const productTag = (product.tag || product.status || '').toLowerCase();
                            const isNew = productTag === 'new' || product.isNew === true || product.new === true;
                            const onlinePrice = product.onlinePrice || product.sellingPrice;
                            const originalPrice = product.onlinePrice ? product.sellingPrice : product.costPerUnit;
                            const isSale = productTag === 'sale' || product.isSale === true || product.sale === true ||
                                (originalPrice && onlinePrice && parseFloat(originalPrice) > parseFloat(onlinePrice));
                            const showBadge = isSale ? 'sale' : (isNew ? 'new' : null);

                            return (
                                <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                                    <div className="product-image-container">
                                        {primaryImage ? (
                                            <>
                                                <LazyImage
                                                    src={primaryImage}
                                                    alt={product.productName}
                                                    className="product-image"
                                                />
                                                {hoverImage && hoverImage !== primaryImage && (
                                                    <LazyImage
                                                        src={hoverImage}
                                                        alt={`${product.productName} - View 2`}
                                                        className="product-image-secondary"
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <div className="product-image-placeholder">
                                                <span>No Image</span>
                                            </div>
                                        )}
                                        {showBadge && (
                                            <span className={`product-badge ${showBadge}-badge`}>
                                                {showBadge === 'sale' ? 'Sale' : 'New'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">
                                            {product.productName || 'Unnamed Product'}
                                            {product.sku && (
                                                <span className="product-sku-inline"> - {product.sku}</span>
                                            )}
                                        </h3>
                                        <div className="product-price">
                                            {isSale && originalPrice && onlinePrice && parseFloat(originalPrice) > parseFloat(onlinePrice) ? (
                                                <div className="price-with-was-now">
                                                    <span className="was-price">Was {formatCurrency(originalPrice)}</span>
                                                    <span className="now-price">Now {formatCurrency(onlinePrice)}</span>
                                                </div>
                                            ) : getProductPrice(product) ? (
                                                <span className="price">{formatCurrency(getProductPrice(product))}</span>
                                            ) : (
                                                <span className="price">Price on request</span>
                                            )}
                                        </div>
                                        <div className="product-stock">
                                            {product.quantity !== undefined ? (
                                                <span className={`stock ${product.quantity <= (product.lowStockThreshold || 10) ? 'low' : 'available'}`}>
                                                    {product.quantity} in stock
                                                </span>
                                            ) : (
                                                <span className="stock">Check availability</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Home;

