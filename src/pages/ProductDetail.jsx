import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';
import './ProductDetail.css';
import React from 'react';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { success, error: showError } = useToast();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [bundleProducts, setBundleProducts] = useState([]);
    const [bundleSelections, setBundleSelections] = useState({});
    const [addingToCart, setAddingToCart] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);

    // Track recently viewed
    useEffect(() => {
        if (id) {
            const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            if (!viewed.includes(id)) {
                viewed.unshift(id);
                if (viewed.length > 10) viewed.pop();
                localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
            }
        }
    }, [id]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const productDoc = doc(db, 'inventory', id);
                const productSnapshot = await getDoc(productDoc);

                if (productSnapshot.exists()) {
                    const productData = {
                        id: productSnapshot.id,
                        ...productSnapshot.data()
                    };
                    setProduct(productData);

                    // Auto-select first available size if sizes exist
                    if (productData.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
                        const firstSize = productData.sizes[0];
                        const firstSizeValue = typeof firstSize === 'object' && firstSize.size
                            ? firstSize.size
                            : firstSize;
                        if (firstSizeValue) {
                            setSelectedSize(firstSizeValue);
                        }
                    }

                    // Fetch related products (same category or brand)
                    if (productData.categoryId || productData.brandId) {
                        const inventoryRef = collection(db, 'inventory');
                        let q = query(inventoryRef, limit(30));
                        const snapshot = await getDocs(q);
                        let allProducts = snapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => {
                                if (p.id === id) return false;

                                // Check if product is online - must be explicitly true
                                const isOnline = p.onlineStatus === true;

                                // Check if product is hidden
                                const status = (p.status || '').toLowerCase();
                                const isHidden = status === 'hidden' || status === 'hide';

                                // Also check for a dedicated hidden field
                                const hasHiddenField = p.hidden === true || p.hide === true;

                                return isOnline && !isHidden && !hasHiddenField;
                            });

                        // Related products for "You may also like"
                        let related = allProducts
                            .filter(p => p.categoryId === productData.categoryId || p.brandId === productData.brandId)
                            .slice(0, 4);
                        setRelatedProducts(related);

                        // Bundle products for "People Love These Products Together" (2 additional products)
                        // Already filtered in allProducts above
                        let bundle = allProducts.slice(0, 2);
                        setBundleProducts(bundle);

                        // Initialize bundle selections with current product
                        setBundleSelections({
                            [id]: { selected: true, size: null }
                        });
                    }
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    const getAvailableSizes = () => {
        if (!product.sizes || !Array.isArray(product.sizes)) return [];
        return product.sizes
            .map(size => {
                if (typeof size === 'object' && size.size) {
                    // Handle quantity - convert to number, handle empty strings
                    const qty = size.quantity;
                    const quantity = (qty === '' || qty === null || qty === undefined)
                        ? 0
                        : (typeof qty === 'number' ? qty : parseInt(qty) || 0);
                    return { size: size.size, quantity: quantity };
                }
                // For non-object sizes, use product quantity or 0
                const productQty = product.quantity;
                const quantity = (productQty === '' || productQty === null || productQty === undefined)
                    ? 0
                    : (typeof productQty === 'number' ? productQty : parseInt(productQty) || 0);
                return { size: size, quantity: quantity };
            })
            .filter(item => item.quantity > 0);
    };

    const handleAddToCart = async () => {
        if (!product) {
            showError('Product not loaded. Please try again.');
            return;
        }

        // Get available sizes
        const availableSizes = getAvailableSizes();

        // If product has sizes, ensure one is selected
        if (availableSizes.length > 0) {
            if (!selectedSize) {
                showError('Please select a size');
                return;
            }
        }

        setAddingToCart(true);

        // Determine size to use
        const size = selectedSize || (availableSizes.length > 0 ? availableSizes[0].size : 'One Size');

        try {
            const result = await addToCart(product, size, 1);

            if (result.success) {
                success(`${product.productName} added to cart!`);
            } else {
                showError(result.error || 'Failed to add product to cart. Please try again.');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            showError('An error occurred while adding to cart. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!product) {
            showError('Product not loaded. Please try again.');
            return;
        }

        // Get available sizes
        const availableSizes = getAvailableSizes();

        // If product has sizes, ensure one is selected
        if (availableSizes.length > 0) {
            if (!selectedSize) {
                showError('Please select a size');
                return;
            }
        }

        setAddingToCart(true);

        // Determine size to use
        const size = selectedSize || (availableSizes.length > 0 ? availableSizes[0].size : 'One Size');

        try {
            // Add product to cart first
            const result = await addToCart(product, size, 1);

            if (result.success) {
                success('Redirecting to checkout...');
                // Small delay to show toast before navigation
                setTimeout(() => {
                    navigate('/checkout');
                }, 500);
            } else {
                showError(result.error || 'Failed to add product to cart. Please try again.');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            showError('An error occurred. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="product-detail-container">
                <div className="loading">Loading product...</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-detail-container">
                <div className="error">{error || 'Product not found'}</div>
                <Link to="/products" className="back-link">← Back to Products</Link>
            </div>
        );
    }

    // Check if product is online and not hidden
    const status = (product.status || '').toLowerCase();
    const isHidden = status === 'hidden' || status === 'hide';
    const hasHiddenField = product.hidden === true || product.hide === true;

    if (product.onlineStatus !== true || isHidden || hasHiddenField) {
        return (
            <div className="product-detail-container">
                <div className="error">This product is not available.</div>
                <Link to="/products" className="back-link">← Back to Products</Link>
            </div>
        );
    }

    const allImages = [];
    if (product.imageUrl) allImages.push(product.imageUrl);
    if (product.productImages && Array.isArray(product.productImages)) {
        allImages.push(...product.productImages.filter(img => img));
    }

    const availableSizes = getAvailableSizes();
    const onlinePrice = product.onlinePrice || product.sellingPrice;
    const originalPrice = product.onlinePrice ? product.sellingPrice : product.costPerUnit;

    return (
        <div className="product-detail-container">
            <div className="product-detail-main">
                <div className="product-image-section">
                    {allImages.length > 0 ? (
                        <>
                            {allImages.length > 1 && (
                                <div className="image-thumbnails">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(idx)}
                                        >
                                            <img src={img} alt={`${product.productName} view ${idx + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="main-image-container">
                                <img
                                    src={allImages[selectedImage]}
                                    alt={product.productName}
                                    className="detail-image"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="detail-image-placeholder">
                            <span>No Image Available</span>
                        </div>
                    )}
                </div>

                <div className="product-info-section">
                    <h1 className="product-title">{product.productName || 'Unnamed Product'}</h1>

                    {product.sku && (
                        <div className="product-code">SKU: {product.sku}</div>
                    )}

                    <div className="product-price-display">
                        {originalPrice && parseFloat(originalPrice) > parseFloat(onlinePrice) ? (
                            <>
                                <span className="original-price-large">{formatCurrency(originalPrice)}</span>
                                <span className="current-price">{formatCurrency(onlinePrice)}</span>
                            </>
                        ) : (
                            <span className="current-price">{formatCurrency(onlinePrice)}</span>
                        )}
                    </div>

                    <div className="tax-shipping-info">
                        Tax included. Shipping calculated at checkout.
                    </div>

                    <div className="reviews-section">
                        <div className="reviews-header">
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="star">★</span>
                                ))}
                            </div>
                            <span className="reviews-text">No reviews</span>
                        </div>
                    </div>

                    {availableSizes.length > 0 && (
                        <div className="size-selection">
                            <label className="size-label">SIZES</label>
                            <div className="size-buttons-grid">
                                {availableSizes.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className={`size-btn ${selectedSize === item.size ? 'selected' : ''} ${item.quantity <= 3 ? 'low-stock' : ''}`}
                                        onClick={() => setSelectedSize(item.size)}
                                        disabled={item.quantity === 0}
                                    >
                                        {item.size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="action-buttons">
                        <button
                            className="btn-add-cart"
                            onClick={handleAddToCart}
                            disabled={addingToCart}
                        >
                            <span>{addingToCart ? 'ADDING...' : 'ADD TO CART'}</span>
                        </button>
                        <button
                            className="btn-buy-now"
                            onClick={handleBuyNow}
                            disabled={addingToCart}
                        >
                            <span>{addingToCart ? 'PROCESSING...' : 'BUY IT NOW'}</span>
                        </button>
                    </div>

                    {/* Description Tabs */}
                    <div className="product-tabs">
                        <button
                            className={`tab ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`tab ${activeTab === 'care' ? 'active' : ''}`}
                            onClick={() => setActiveTab('care')}
                        >
                            Care Guide
                        </button>
                        <button
                            className={`tab ${activeTab === 'size' ? 'active' : ''}`}
                            onClick={() => setActiveTab('size')}
                        >
                            Size Guide
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'description' && (
                            <div className="description-content">
                                {product.description ? (
                                    product.description.split('\n').map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))
                                ) : (
                                    <p>No description available.</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'care' && (
                            <div className="care-content">
                                {product.careGuide ? (
                                    <div>
                                        {product.careGuide.split('\n').map((para, idx) => (
                                            <p key={idx}>{para}</p>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Care instructions will be displayed here. You can add care guide information in your admin panel.</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'size' && (
                            <div className="size-guide-content">
                                <p>Size guide information will be displayed here. You can add size guide details in your admin panel.</p>
                                <div className="size-guide-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Size</th>
                                                <th>Chest (inches)</th>
                                                <th>Length (inches)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>S</td><td>38-40</td><td>28</td></tr>
                                            <tr><td>M</td><td>40-42</td><td>29</td></tr>
                                            <tr><td>L</td><td>42-44</td><td>30</td></tr>
                                            <tr><td>XL</td><td>44-46</td><td>31</td></tr>
                                            <tr><td>2XL</td><td>46-48</td><td>32</td></tr>
                                            <tr><td>3XL</td><td>48-50</td><td>33</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* People Love These Products Together - Bundle Section */}
            {bundleProducts.length > 0 && (
                <section className="bundle-section">
                    <h2 className="bundle-title">People Love These Products Together</h2>
                    <div className="bundle-products-display">
                        <div className="bundle-product-item">
                            <img
                                src={
                                    (product.imageUrl && product.imageUrl.trim() !== '')
                                        ? product.imageUrl
                                        : (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0
                                            ? product.productImages[0]
                                            : '')
                                }
                                alt={product.productName}
                                className="bundle-product-image"
                            />
                        </div>
                        <span className="bundle-plus">+</span>
                        {bundleProducts.map((bundleProduct, idx) => {
                            const bundleImage = (bundleProduct.imageUrl && bundleProduct.imageUrl.trim() !== '')
                                ? bundleProduct.imageUrl
                                : (bundleProduct.productImages && Array.isArray(bundleProduct.productImages) && bundleProduct.productImages.length > 0
                                    ? bundleProduct.productImages[0]
                                    : '');

                            return (
                                <React.Fragment key={bundleProduct.id}>
                                    <div className="bundle-product-item">
                                        <img
                                            src={bundleImage}
                                            alt={bundleProduct.productName}
                                            className="bundle-product-image"
                                        />
                                    </div>
                                    {idx < bundleProducts.length - 1 && <span className="bundle-plus">+</span>}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className="bundle-total-price">
                        Total price: {formatCurrency(
                            (parseFloat(onlinePrice) || 0) +
                            bundleProducts.reduce((sum, bp) => {
                                const bpPrice = bp.onlinePrice || bp.sellingPrice || 0;
                                return sum + (bundleSelections[bp.id]?.selected ? parseFloat(bpPrice) : 0);
                            }, 0)
                        )}
                    </div>

                    <button className="btn-bundle-cart" onClick={() => {
                        const selected = [product.id, ...bundleProducts.filter(bp => bundleSelections[bp.id]?.selected).map(bp => bp.id)];
                        alert(`Adding ${selected.length} products to cart!`);
                    }}>
                        ADD SELECTED TO CART
                    </button>

                    <div className="bundle-items-list">
                        {/* Current Product */}
                        <div className="bundle-item">
                            <label className="bundle-item-label">
                                <input
                                    type="checkbox"
                                    checked={true}
                                    readOnly
                                    className="bundle-checkbox"
                                />
                                <span>This item: {product.productName} - {product.sku || 'N/A'}</span>
                            </label>
                            <div className="bundle-item-details">
                                <select
                                    className="bundle-size-select"
                                    value={selectedSize || ''}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                >
                                    <option value="">Select Size</option>
                                    {availableSizes.map((item, idx) => (
                                        <option key={idx} value={item.size}>{item.size}</option>
                                    ))}
                                </select>
                                <span className="bundle-item-price">{formatCurrency(onlinePrice)}</span>
                            </div>
                        </div>

                        {/* Bundle Products */}
                        {bundleProducts.map((bundleProduct) => {
                            const bpPrice = bundleProduct.onlinePrice || bundleProduct.sellingPrice;
                            const bpSizes = bundleProduct.sizes && Array.isArray(bundleProduct.sizes)
                                ? bundleProduct.sizes.map(s => typeof s === 'object' && s.size ? s.size : s).filter(Boolean)
                                : [];

                            return (
                                <div key={bundleProduct.id} className="bundle-item">
                                    <label className="bundle-item-label">
                                        <input
                                            type="checkbox"
                                            checked={bundleSelections[bundleProduct.id]?.selected || false}
                                            onChange={(e) => {
                                                setBundleSelections(prev => ({
                                                    ...prev,
                                                    [bundleProduct.id]: {
                                                        ...prev[bundleProduct.id],
                                                        selected: e.target.checked
                                                    }
                                                }));
                                            }}
                                            className="bundle-checkbox"
                                        />
                                        <span>{bundleProduct.productName} - {bundleProduct.sku || 'N/A'}</span>
                                    </label>
                                    <div className="bundle-item-details">
                                        <select
                                            className="bundle-size-select"
                                            value={bundleSelections[bundleProduct.id]?.size || ''}
                                            onChange={(e) => {
                                                setBundleSelections(prev => ({
                                                    ...prev,
                                                    [bundleProduct.id]: {
                                                        ...prev[bundleProduct.id],
                                                        size: e.target.value
                                                    }
                                                }));
                                            }}
                                            disabled={!bundleSelections[bundleProduct.id]?.selected}
                                        >
                                            <option value="">Select Size</option>
                                            {bpSizes.map((size, idx) => (
                                                <option key={idx} value={size}>{size}</option>
                                            ))}
                                        </select>
                                        <span className="bundle-item-price">{formatCurrency(bpPrice)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="related-products-section">
                    <h2 className="section-heading">You may also like</h2>
                    <div className="related-products-grid">
                        {relatedProducts.map((related) => {
                            const relatedPrice = related.onlinePrice || related.sellingPrice;
                            const relatedSizes = related.sizes && Array.isArray(related.sizes)
                                ? related.sizes.map(s => typeof s === 'object' && s.size ? s.size : s).filter(Boolean).slice(0, 3)
                                : [];

                            // Get image - use imageUrl first, fallback to productImages[0]
                            const relatedImage = (related.imageUrl && related.imageUrl.trim() !== '')
                                ? related.imageUrl
                                : (related.productImages && Array.isArray(related.productImages) && related.productImages.length > 0
                                    ? related.productImages[0]
                                    : null);

                            return (
                                <Link key={related.id} to={`/products/${related.id}`} className="related-product-card">
                                    {relatedImage ? (
                                        <img src={relatedImage} alt={related.productName} className="related-product-image" />
                                    ) : (
                                        <div className="related-product-image-placeholder">No Image</div>
                                    )}
                                    <div className="related-product-info">
                                        <h3 className="related-product-name">{related.productName}</h3>
                                        <div className="related-product-price">{formatCurrency(relatedPrice)}</div>
                                        {relatedSizes.length > 0 && (
                                            <div className="related-product-sizes">
                                                {relatedSizes.map((size, idx) => (
                                                    <span key={idx} className="related-size-badge">{size}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Delivery & Returns Information */}
            <section className="info-section">
                <h2 className="info-section-title">Deliveries & Returns Information</h2>

                <div className="info-subsection">
                    <h3 className="info-subtitle">DELIVERIES:</h3>
                    <p>FLAT Shipping 249PKR will be charged on orders within Pakistan.</p>
                </div>

                <div className="info-subsection">
                    <h3 className="info-subtitle">FAST & RELIABLE DELIVERY (2-4 Working Days):</h3>
                    <p>We utilize the best courier services for all our shipments.</p>
                    <ul>
                        <li>Karachi: 1-2 working days</li>
                        <li>Other Cities: 2-4 working days</li>
                    </ul>
                    <p>Check out our delivery policy for more information. Your satisfaction is what matters most.</p>
                </div>

                <div className="info-subsection">
                    <h3 className="info-subtitle">URGENT DELIVERIES:</h3>
                    <p>Need your order fast? We offer urgent fast shipping options. Contact our customer service for details and pricing. <a href="#contact" className="info-link">(Click Here)</a></p>
                </div>
            </section>

            {/* Customer Support */}
            <section className="info-section">
                <h2 className="info-section-title">CUSTOMER SUPPORT AT YOUR FINGERTIPS:</h2>
                <ul className="support-list">
                    <li>Email: core@dressify.com</li>
                    <li>WhatsApp Us: <a href="https://wa.me/923019229998" className="info-link">(Click Here)</a></li>
                    <li>DM us on Instagram: @dressify</li>
                </ul>
                <p>Your satisfaction is our focus.</p>
            </section>

            {/* Returns & Exchanges */}
            <section className="info-section">
                <h2 className="info-section-title">EASY RETURNS & SIZE EXCHANGES FOR YOUR CONVENIENCE:</h2>
                <p>All products purchased from dressify.com can be exchanged within 7 days of purchase only if:</p>
                <ul className="returns-list">
                    <li>The item(s) is defective/faulty at the time of delivery.</li>
                    <li>The item(s) does not match the original specification. You will be required to share photographic evidence of the defective item to prove the claim.</li>
                    <li>Any articles that are on sale are not eligible for exchange or return.</li>
                    <li>Vests are not applicable for return due to hygiene reasons.</li>
                    <li>Items purchased on sale are not eligible for refunds.</li>
                </ul>
                <p><a href="#returns" className="info-link">(Click Here)</a> for further information regarding exchanges and returns.</p>
            </section>

            {/* Payment Methods */}
            <section className="info-section">
                <h2 className="info-section-title">PAYMENT METHODS:</h2>
                <ul className="payment-list">
                    <li>Secure PAYFAST (Pay via Debit/Credit/Wallet/Bank Account).</li>
                    <li>Cash on Delivery (COD).</li>
                    <li>Bank Deposit: Make your payment directly into our bank account. Please use Order ID as the payment reference. Your order won't be shipped until the funds have cleared in our account.</li>
                </ul>
            </section>

            {/* Reviews Section */}
            {showReviewForm ? (
                <ReviewForm
                    productId={product.id}
                    productName={product.productName}
                    onClose={() => setShowReviewForm(false)}
                    onReviewSubmitted={() => {
                        setShowReviewForm(false);
                        // The ReviewsList will automatically refresh when productId changes
                        // or you can add a refresh mechanism if needed
                    }}
                />
            ) : (
                <ReviewsList
                    productId={product.id}
                    onWriteReview={() => setShowReviewForm(true)}
                />
            )}
        </div>
    );
}

export default ProductDetail;
