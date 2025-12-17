import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import './SearchModal.css';

function SearchModal({ isOpen, onClose }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const searchProducts = async () => {
            if (searchQuery.trim().length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const inventoryCollection = collection(db, 'inventory');
                const q = query(inventoryCollection, orderBy('productName', 'asc'), limit(50));
                const snapshot = await getDocs(q);
                
                const allProducts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const queryLower = searchQuery.toLowerCase();
                const filtered = allProducts
                    .filter(product => {
                        if (product.onlineStatus !== true) return false;
                        const status = (product.status || '').toLowerCase();
                        if (status === 'hidden' || status === 'hide') return false;
                        
                        return (
                            product.productName?.toLowerCase().includes(queryLower) ||
                            product.sku?.toLowerCase().includes(queryLower) ||
                            product.description?.toLowerCase().includes(queryLower)
                        );
                    })
                    .slice(0, 8);

                setResults(filtered);
            } catch (error) {
                console.error('Error searching products:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleProductClick = (productId) => {
        navigate(`/products/${productId}`);
        onClose();
    };

    const handleViewAll = () => {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay" onClick={onClose}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="search-modal-header">
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="search-close" onClick={onClose}>×</button>
                </div>
                <div className="search-results">
                    {loading && (
                        <div className="search-loading">Searching...</div>
                    )}
                    {!loading && searchQuery.trim().length < 2 && (
                        <div className="search-placeholder">Type at least 2 characters to search</div>
                    )}
                    {!loading && searchQuery.trim().length >= 2 && results.length === 0 && (
                        <div className="search-no-results">No products found</div>
                    )}
                    {!loading && results.length > 0 && (
                        <>
                            <div className="search-results-list">
                                {results.map(product => {
                                    const image = product.imageUrl || 
                                        (product.productImages && product.productImages[0]) || 
                                        null;
                                    const price = product.onlinePrice || product.sellingPrice;
                                    
                                    return (
                                        <div
                                            key={product.id}
                                            className="search-result-item"
                                            onClick={() => handleProductClick(product.id)}
                                        >
                                            {image && (
                                                <img src={image} alt={product.productName} className="search-result-image" />
                                            )}
                                            <div className="search-result-info">
                                                <div className="search-result-name">{product.productName}</div>
                                                {product.sku && (
                                                    <div className="search-result-sku">SKU: {product.sku}</div>
                                                )}
                                                {price && (
                                                    <div className="search-result-price">Rs. {parseFloat(price).toLocaleString()}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {results.length >= 8 && (
                                <button className="search-view-all" onClick={handleViewAll}>
                                    View all results for "{searchQuery}"
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SearchModal;

