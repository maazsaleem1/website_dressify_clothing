import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../contexts/CartContext';
import { useCartDrawer } from '../contexts/CartDrawerContext';
import { useToast } from '../contexts/ToastContext';
import ProductSkeleton from '../components/ProductSkeleton';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './Products.css';

function Products() {
    const navigate = useNavigate();
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
    const [addingId, setAddingId] = useState(null);
    const { addToCart } = useCart();
    const { openCartDrawer } = useCartDrawer();
    const { success: showSuccess, error: showError } = useToast();

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

    // When a filtered view (category, search, etc.) has no products, auto-redirect to all products so user sees products without clicking "Browse All Products"
    useEffect(() => {
        if (loading || error) return;
        const hasFilter = category || brand || searchQuery || productIds || productId || filter;
        if (products.length === 0 && hasFilter) {
            navigate('/products', { replace: true });
        }
    }, [loading, error, products.length, category, brand, searchQuery, productIds, productId, filter, navigate]);

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
                .filter((size, index, self) => self.indexOf(size) === index);
        }
        return [];
    };

    const getDefaultSize = (product) => {
        const sizes = getSizes(product);
        if (sizes.length > 0) return sizes[0];
        return 'M';
    };

    const handleQuickAdd = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        if (addingId) return;
        const size = getDefaultSize(product);
        setAddingId(product.id);
        try {
            const result = await addToCart(product, size, 1);
            if (result.success) {
                showSuccess(`${product.productName || 'Product'} added to cart`);
                openCartDrawer();
            } else {
                showError(result.error || 'Could not add to cart');
            }
        } catch (err) {
            showError('Could not add to cart');
        } finally {
            setAddingId(null);
        }
    };

    if (loading) {
        return (
            <div className="products-container">
                <div className="products-layout">
                    <div className="products-main">
                        <div className="products-header-pegador">
                            <div className="products-header-left">
                                <h1 className="page-title-pegador">
                                    MOMENTS TO MEMORIES <span className="page-title-pipe">|</span> <span className="page-title-category">—</span>
                                </h1>
                            </div>
                        </div>
                        <div className="products-grid products-grid-pegador">
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

                {/* Main Content - Pegador style */}
                <div className="products-main">
                    <div className="products-header-pegador">
                        <div className="products-header-left">
                            <h1 className="page-title-pegador">
                                MOMENTS TO MEMORIES
                                <span className="page-title-pipe"> | </span>
                                <span className="page-title-category">
                                    {productIds ? 'COLLECTION' :
                                        productId ? 'PRODUCT' :
                                            searchQuery ? searchQuery.toUpperCase() :
                                                filter === 'low-stock' ? 'LOW STOCK' :
                                                    filter === 'new' ? 'NEW ARRIVALS' :
                                                        category === 'men' ? 'MEN' :
                                                            category === 'women' ? 'WOMEN' :
                                                                brand ? (brand.toUpperCase()) :
                                                                    'ALL PRODUCTS'}
                                </span>
                            </h1>
                            {!loading && (
                                <p className="products-count-pegador">
                                    {products.length} {products.length === 1 ? 'Product' : 'Products'}
                                </p>
                            )}
                        </div>
                        <div className="products-controls">
                            <button className="filter-toggle filter-btn-pegador" onClick={() => setShowFilters(!showFilters)}>
                                Filter →
                            </button>
                            <select
                                className="sort-select sort-select-pegador"
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
                        <div className="products-grid products-grid-pegador">
                            {products.map((product) => {
                                const onlinePrice = product.onlinePrice || product.sellingPrice;
                                const originalPrice = product.onlinePrice ? product.sellingPrice : product.costPerUnit;
                                const discount = calculateDiscount(originalPrice, onlinePrice);

                                const productTag = (product.tag || product.status || '').toLowerCase();
                                const isNew = productTag === 'new' || product.isNew === true || product.new === true;
                                const isSale = productTag === 'sale' || product.isSale === true || product.sale === true || discount > 0;
                                const showBadge = isSale ? 'sale' : (isNew ? 'new' : null);

                                const primaryImage = product.imageUrl && product.imageUrl.trim() !== ''
                                    ? product.imageUrl
                                    : (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0
                                        ? product.productImages[0]
                                        : null);

                                const hoverImage = product.productImages && Array.isArray(product.productImages) && product.productImages.length > 1
                                    ? product.productImages[1]
                                    : (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0 && primaryImage !== product.productImages[0]
                                        ? product.productImages[0]
                                        : null);

                                return (
                                    <Link key={product.id} to={`/products/${product.id}`} className="product-card product-card-pegador">
                                        <div className="product-image-container">
                                            {primaryImage ? (
                                                <>
                                                    <img src={primaryImage} alt={product.productName} className="product-image" />
                                                    {hoverImage && hoverImage !== primaryImage && (
                                                        <img src={hoverImage} alt="" className="product-image-secondary" />
                                                    )}
                                                </>
                                            ) : (
                                                <div className="product-image-placeholder">
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                            {showBadge && (
                                                <span className={`product-badge product-badge-pegador ${showBadge}-badge`}>
                                                    {showBadge === 'sale' ? 'Sale' : 'New'}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="product-quick-add"
                                                aria-label="Add to cart"
                                                onClick={(e) => handleQuickAdd(e, product)}
                                                disabled={addingId === product.id}
                                            >
                                                {addingId === product.id ? '…' : '+'}
                                            </button>
                                        </div>
                                        <div className="product-info product-info-pegador">
                                            <h3 className="product-name product-name-pegador">
                                                {product.productName || 'Unnamed Product'}
                                            </h3>
                                            <p className="product-price product-price-pegador">
                                                {onlinePrice ? formatCurrency(onlinePrice) : 'Price on request'}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Products;

