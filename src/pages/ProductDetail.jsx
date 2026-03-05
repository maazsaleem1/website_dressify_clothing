import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../contexts/CartContext';
import { useCartDrawer } from '../contexts/CartDrawerContext';
import { useToast } from '../contexts/ToastContext';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';
import './ProductDetail.css';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { openCartDrawer } = useCartDrawer();
    const { success, error: showError } = useToast();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [openAccordion, setOpenAccordion] = useState(null);
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

                    // Default to S/M/L/XL: auto-select first available size or 'M'
                    const sizes = productData.sizes && Array.isArray(productData.sizes) ? productData.sizes : [];
                    const firstSizeVal = sizes.length > 0
                        ? (typeof sizes[0] === 'object' && sizes[0].size ? sizes[0].size : sizes[0])
                        : null;
                    const useDefaultSizes = !firstSizeVal || firstSizeVal === 'One Size';
                    setSelectedSize(useDefaultSizes ? 'M' : firstSizeVal);
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

        if (!selectedSize) {
            showError('Please select a size');
            return;
        }

        setAddingToCart(true);

        try {
            const result = await addToCart(product, selectedSize, 1);

            if (result.success) {
                success(`${product.productName} added to cart!`);
                openCartDrawer();
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

        if (!selectedSize) {
            showError('Please select a size');
            return;
        }

        setAddingToCart(true);

        try {
            const result = await addToCart(product, selectedSize, 1);

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
    const hasRealSizes = availableSizes.length > 0 && availableSizes.some(s => s.size !== 'One Size');
    const defaultSizeTags = [{ size: 'S', quantity: 99 }, { size: 'M', quantity: 99 }, { size: 'L', quantity: 99 }, { size: 'XL', quantity: 99 }];
    const sizeOptions = hasRealSizes ? availableSizes : defaultSizeTags;
    const onlinePrice = product.onlinePrice || product.sellingPrice;
    const originalPrice = product.onlinePrice ? product.sellingPrice : product.costPerUnit;

    return (
        <div className="product-detail-container">
            <div className="product-detail-main">
                <div className="product-image-section">
                    {allImages.length > 0 ? (
                        <>
                            <div className="main-image-container">
                                <img
                                    src={allImages[selectedImage]}
                                    alt={product.productName}
                                    className="detail-image"
                                />
                            </div>
                            {allImages.length > 1 && (
                                <div className="image-thumbnails image-thumbnails-bottom">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(idx)}
                                        >
                                            <img src={img} alt={`${product.productName} view ${idx + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="detail-image-placeholder">
                            <span>No Image Available</span>
                        </div>
                    )}
                </div>

                <div className="product-info-section">
                    <h1 className="product-title">{(product.productName || 'Unnamed Product').toUpperCase()}</h1>

                    {product.sku && (
                        <div className="product-code">{product.sku}</div>
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

                    <p className="tax-shipping-note">Tax included. <a href="#shipping" className="tax-shipping-link">Shipping</a> calculated at checkout.</p>

                    {allImages.length > 1 && (
                        <div className="product-color-thumbnails">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`color-thumb ${selectedImage === idx ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(idx)}
                                >
                                    <img src={img} alt="" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="size-selection">
                        <label className="size-label">Size</label>
                        <p className="size-model-note">Model (187 cm, 84 kg) wears size M</p>
                        <div className="size-buttons-grid">
                            {sizeOptions.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`size-btn ${selectedSize === item.size ? 'selected' : ''} ${item.quantity <= 3 ? 'low-stock' : ''}`}
                                    onClick={() => setSelectedSize(item.size)}
                                    disabled={item.quantity === 0}
                                >
                                    {item.size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn-add-cart-single"
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                    >
                        {addingToCart ? 'ADDING...' : 'ADD TO CART'}
                    </button>

                    <div className="product-benefits">
                        <p className="benefit-line"><span className="benefit-icon benefit-icon-check">✓</span> In stock and ready to ship</p>
                        <p className="benefit-line"><span className="benefit-icon benefit-icon-package" aria-hidden>📦</span> Free shipping on orders over Rs. 2,999</p>
                        <p className="benefit-line"><span className="benefit-icon benefit-icon-return" aria-hidden>↩</span> Free returns</p>
                        <p className="benefit-line"><span className="benefit-icon benefit-icon-loyalty" aria-hidden>◆</span> Earn 300 loyalty points</p>
                    </div>

                    <div className="product-accordions">
                        <div className="accordion-item">
                            <button type="button" className="accordion-head" onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}>
                                <span>Product details</span>
                                <span className="accordion-icon">{openAccordion === 'details' ? '−' : '+'}</span>
                            </button>
                            {openAccordion === 'details' && (
                                <div className="accordion-body">
                                    {product.description ? (
                                        product.description.split('\n').map((para, idx) => <p key={idx}>{para}</p>)
                                    ) : (
                                        <p>No description available.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="accordion-item">
                            <button type="button" className="accordion-head" onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}>
                                <span>Material & care</span>
                                <span className="accordion-icon">{openAccordion === 'care' ? '−' : '+'}</span>
                            </button>
                            {openAccordion === 'care' && (
                                <div className="accordion-body">
                                    {product.careGuide ? (
                                        product.careGuide.split('\n').map((para, idx) => <p key={idx}>{para}</p>)
                                    ) : (
                                        <p>Care instructions can be added in the admin panel.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="accordion-item">
                            <button type="button" className="accordion-head" onClick={() => setOpenAccordion(openAccordion === 'info' ? null : 'info')}>
                                <span>Further information</span>
                                <span className="accordion-icon">{openAccordion === 'info' ? '−' : '+'}</span>
                            </button>
                            {openAccordion === 'info' && (
                                <div className="accordion-body">
                                    {product.sku && <p><strong>SKU:</strong> {product.sku}</p>}
                                    <div className="size-guide-table">
                                        <table>
                                            <thead>
                                                <tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th></tr>
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
            </div>

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
