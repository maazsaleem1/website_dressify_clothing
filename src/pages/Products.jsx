import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductSkeleton from '../components/ProductSkeleton';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import LazyImage from '../components/LazyImage';
import './Products.css';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const productIds = searchParams.get('ids'); // Multiple product IDs (comma-separated)
    const productId = searchParams.get('product'); // Single product ID
    const searchQuery = searchParams.get('search'); // Custom search query
    const [sortBy, setSortBy] = useState('featured');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                let q;

                try {
                    if (filter === 'low-stock') {
                        // For low stock, we'll filter client-side since Firestore doesn't support complex queries easily
                        q = query(collection(db, 'inventory'), orderBy('quantity', 'asc'));
                    } else if (filter === 'new') {
                        q = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
                    } else {
                        q = query(collection(db, 'inventory'), orderBy('productName', 'asc'));
                    }
                } catch (queryError) {
                    // If orderBy fails (field might not exist or not indexed), just get all documents
                    console.warn('OrderBy query failed, fetching all documents:', queryError);
                    q = query(collection(db, 'inventory'));
                }

                const snapshot = await getDocs(q);
                let productsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Handle multiple product IDs (from slider)
                if (productIds) {
                    const idsArray = productIds.split(',').map(id => id.trim()).filter(Boolean);
                    productsList = productsList.filter(product => idsArray.includes(product.id));
                }

                // Handle single product ID (from slider)
                if (productId) {
                    productsList = productsList.filter(product => product.id === productId);
                }

                // Handle search query (from slider)
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    productsList = productsList.filter(product => {
                        const matchesName = product.productName?.toLowerCase().includes(query);
                        const matchesDescription = product.description?.toLowerCase().includes(query);
                        const matchesSku = product.sku?.toLowerCase().includes(query);
                        const matchesTag = (product.tag || product.status || '').toLowerCase().includes(query);

                        // Special handling for common queries
                        const isNewArrivals = (query === 'new arrivals' || query === 'new') &&
                            (product.tag === 'new' || product.status === 'new' || product.isNew === true || product.new === true);
                        const isSale = query === 'sale' &&
                            (product.tag === 'sale' || product.status === 'sale' || product.isSale === true || product.sale === true);

                        return matchesName || matchesDescription || matchesSku || matchesTag || isNewArrivals || isSale;
                    });
                }

                // Filter low stock items if needed
                if (filter === 'low-stock') {
                    productsList = productsList.filter(product => {
                        // Check if product has sizes with quantities
                        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
                            // Sum up quantities from sizes array
                            const totalQuantity = product.sizes.reduce((sum, sizeItem) => {
                                const qty = typeof sizeItem === 'object' && sizeItem.quantity !== undefined
                                    ? sizeItem.quantity
                                    : 0;
                                return sum + (typeof qty === 'number' ? qty : parseInt(qty) || 0);
                            }, 0);
                            return totalQuantity <= (product.lowStockThreshold || 10);
                        }
                        // Fallback to top-level quantity
                        const qty = product.quantity;
                        const quantity = (qty === '' || qty === null || qty === undefined)
                            ? 0
                            : (typeof qty === 'number' ? qty : parseInt(qty) || 0);
                        return quantity !== undefined && quantity <= (product.lowStockThreshold || 10);
                    });
                }

                // Filter by category if provided
                if (category) {
                    productsList = productsList.filter(product =>
                        product.categoryId === category
                    );
                }

                // Filter by brand if provided
                if (brand) {
                    productsList = productsList.filter(product =>
                        product.brandId === brand
                    );
                }

                // Filter only products that are online and not hidden
                // Only show products where onlineStatus === true (explicitly set to true)
                // Exclude products with status "hidden" or "hide"
                const onlineProducts = productsList.filter(product => {
                    // Check if product is online - must be explicitly true
                    const isOnline = product.onlineStatus === true;

                    // Check if product is hidden
                    const status = (product.status || '').toLowerCase();
                    const isHidden = status === 'hidden' || status === 'hide';

                    // Also check for a dedicated hidden field
                    const hasHiddenField = product.hidden === true || product.hide === true;

                    return isOnline && !isHidden && !hasHiddenField;
                });

                // Only show products with onlineStatus === true (explicitly set)
                productsList = onlineProducts;

                // Sort products if orderBy failed
                if (filter === 'new') {
                    productsList.sort((a, b) => {
                        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                        return dateB - dateA;
                    });
                } else if (!filter || filter !== 'low-stock') {
                    productsList.sort((a, b) => {
                        const nameA = (a.productName || '').toLowerCase();
                        const nameB = (b.productName || '').toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                }


                setProducts(productsList);
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [filter, category, brand, productIds, productId, searchQuery, sortBy]);

    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    const calculateDiscount = (cost, selling) => {
        if (!cost || !selling) return 0;
        const costNum = parseFloat(cost);
        const sellingNum = parseFloat(selling);
        if (costNum <= sellingNum) return 0;
        return Math.round(((costNum - sellingNum) / costNum) * 100);
    };

    const getSizes = (product) => {
        if (product.sizes && Array.isArray(product.sizes)) {
            return product.sizes
                .map(size => typeof size === 'object' && size.size ? size.size : size)
                .filter(Boolean)
                .filter((size, index, self) => self.indexOf(size) === index); // Remove duplicates
        }
        return [];
    };

    if (loading) {
        return (
            <div className="products-container">
                <div className="products-layout">
                    <div className="products-main">
                        <div className="products-header">
                            <h1 className="page-title">Loading Products...</h1>
                        </div>
                        <div className="products-grid">
                            <ProductSkeleton count={8} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="products-container">
                <ErrorState
                    message={error}
                    onRetry={() => {
                        setError(null);
                        // Trigger re-fetch by updating a dependency
                        window.location.reload();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="products-container">
            {showFilters && <div className="filter-overlay" onClick={() => setShowFilters(false)}></div>}
            <div className="products-layout">
                {/* Filter Sidebar */}
                <aside className={`filter-sidebar ${showFilters ? 'open' : ''}`}>
                    <div className="filter-header">
                        <h2>Filters</h2>
                        <button className="close-filters" onClick={() => setShowFilters(false)}>×</button>
                    </div>
                    <div className="filter-section">
                        <div className="filter-title">
                            CATEGORY <span className="filter-arrow">▼</span>
                        </div>
                    </div>
                    <div className="filter-section">
                        <div className="filter-title">
                            TYPES <span className="filter-arrow">▼</span>
                        </div>
                    </div>
                    <div className="filter-section">
                        <div className="filter-title">
                            PRICE <span className="filter-arrow">▼</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="products-main">
                    <div className="products-header">
                        <h1 className="page-title">
                            {productIds ? 'Featured Collection' :
                                productId ? 'Product' :
                                    searchQuery ? `Search: ${searchQuery}` :
                                        filter === 'low-stock' ? 'Low Stock Items' :
                                            filter === 'new' ? 'New Arrivals' :
                                                category ? 'Category Products' :
                                                    brand ? 'Brand Products' :
                                                        'All Products'}
                        </h1>
                        <div className="products-controls">
                            <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                                Filters
                            </button>
                            <select
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">Newest</option>
                                <option value="name">Name: A to Z</option>
                            </select>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <EmptyState
                            title="No products found"
                            message={
                                productIds ? 'The selected products are not available.' :
                                    productId ? 'This product is not available.' :
                                        searchQuery ? `No products found matching "${searchQuery}".` :
                                            filter === 'low-stock' ? 'No low stock items found.' :
                                                filter === 'new' ? 'No new products available.' :
                                                    category ? 'No products found in this category.' :
                                                        brand ? 'No products found for this brand.' :
                                                            'No products available at the moment.'
                            }
                            actionText="Browse All Products"
                            actionLink="/products"
                            icon={searchQuery ? '🔍' : '📦'}
                        />
                    ) : (
                        <>
                            <div className="products-count">
                                Showing {products.length} {products.length === 1 ? 'product' : 'products'}
                            </div>
                            <div className="products-grid">
                                {products.map((product) => {
                                    const onlinePrice = product.onlinePrice || product.sellingPrice;
                                    const originalPrice = product.onlinePrice ? product.sellingPrice : product.costPerUnit;
                                    const discount = calculateDiscount(originalPrice, onlinePrice);
                                    const sizes = getSizes(product);

                                    // Check for "New" or "Sale" badges from admin
                                    const productTag = (product.tag || product.status || '').toLowerCase();
                                    const isNew = productTag === 'new' || product.isNew === true || product.new === true;
                                    const isSale = productTag === 'sale' || product.isSale === true || product.sale === true || discount > 0;

                                    // Determine which badge to show (Sale takes priority)
                                    const showBadge = isSale ? 'sale' : (isNew ? 'new' : null);

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

                                    return (
                                        <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                                            <div className="product-image-container">
                                                {primaryImage ? (
                                                    <>
                                                        <img src={primaryImage} alt={product.productName} className="product-image" />
                                                        {hoverImage && hoverImage !== primaryImage && (
                                                            <img src={hoverImage} alt={`${product.productName} - View 2`} className="product-image-secondary" />
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
                                                    ) : onlinePrice ? (
                                                        <span className="price">{formatCurrency(onlinePrice)}</span>
                                                    ) : (
                                                        <span className="price">Price on request</span>
                                                    )}
                                                </div>
                                                {sizes.length > 0 && (
                                                    <div className="product-sizes">
                                                        {sizes.slice(0, 5).map((size, idx) => (
                                                            <span key={idx} className="size-badge">{size}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Products;

