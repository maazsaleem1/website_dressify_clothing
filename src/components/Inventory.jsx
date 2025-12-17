import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Inventory.css';

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                setLoading(true);
                const inventoryCollection = collection(db, 'inventory');
                const inventorySnapshot = await getDocs(inventoryCollection);
                const inventoryList = inventorySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInventory(inventoryList);
                setError(null);
            } catch (err) {
                console.error('Error fetching inventory:', err);
                setError('Failed to load inventory. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString();
        }
        return new Date(timestamp).toLocaleDateString();
    };

    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        return `Rs. ${parseFloat(value).toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="inventory-container">
                <div className="loading">Loading inventory...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="inventory-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="inventory-container">
            <h1 className="inventory-title">Inventory</h1>
            <div className="inventory-grid">
                {inventory.length === 0 ? (
                    <div className="no-items">No inventory items found.</div>
                ) : (
                    inventory.map((item) => (
                        <div key={item.id} className="inventory-card">
                            <div className="card-header">
                                <h2 className="product-name">{item.productName || 'Unnamed Product'}</h2>
                                {item.quantity !== undefined && (
                                    <span className={`stock-badge ${item.quantity <= (item.lowStockThreshold || 10) ? 'low-stock' : 'in-stock'}`}>
                                        {item.quantity} in stock
                                    </span>
                                )}
                            </div>

                            {item.imageUrl && (
                                <div className="product-image">
                                    <img src={item.imageUrl} alt={item.productName} />
                                </div>
                            )}

                            <div className="card-body">
                                <div className="info-row">
                                    <span className="label">Product ID:</span>
                                    <span className="value">{item.id}</span>
                                </div>

                                {item.brandId && (
                                    <div className="info-row">
                                        <span className="label">Brand ID:</span>
                                        <span className="value">{item.brandId}</span>
                                    </div>
                                )}

                                {item.categoryId && (
                                    <div className="info-row">
                                        <span className="label">Category ID:</span>
                                        <span className="value">{item.categoryId}</span>
                                    </div>
                                )}

                                <div className="price-row">
                                    {item.costPerUnit && (
                                        <div className="price-item">
                                            <span className="price-label">Cost:</span>
                                            <span className="price-value cost">{formatCurrency(item.costPerUnit)}</span>
                                        </div>
                                    )}

                                    {item.sellingPrice && (
                                        <div className="price-item">
                                            <span className="price-label">Price:</span>
                                            <span className="price-value selling">{formatCurrency(item.sellingPrice)}</span>
                                        </div>
                                    )}
                                </div>

                                {item.quantity !== undefined && (
                                    <div className="info-row">
                                        <span className="label">Quantity:</span>
                                        <span className="value">{item.quantity}</span>
                                    </div>
                                )}

                                {item.initialQuantity !== undefined && (
                                    <div className="info-row">
                                        <span className="label">Initial Quantity:</span>
                                        <span className="value">{item.initialQuantity}</span>
                                    </div>
                                )}

                                {item.lowStockThreshold !== undefined && (
                                    <div className="info-row">
                                        <span className="label">Low Stock Threshold:</span>
                                        <span className="value">{item.lowStockThreshold}</span>
                                    </div>
                                )}

                                {item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0 && (
                                    <div className="info-row">
                                        <span className="label">Sizes:</span>
                                        <span className="value">
                                            {item.sizes.map((size, idx) =>
                                                typeof size === 'object' && size.size ? size.size : size
                                            ).join(', ')}
                                        </span>
                                    </div>
                                )}

                                {item.notes && (
                                    <div className="info-row">
                                        <span className="label">Notes:</span>
                                        <span className="value">{item.notes}</span>
                                    </div>
                                )}

                                {item.subcategory && (
                                    <div className="info-row">
                                        <span className="label">Subcategory:</span>
                                        <span className="value">{item.subcategory}</span>
                                    </div>
                                )}

                                <div className="date-row">
                                    {item.createdAt && (
                                        <div className="date-item">
                                            <span className="date-label">Created:</span>
                                            <span className="date-value">{formatDate(item.createdAt)}</span>
                                        </div>
                                    )}

                                    {item.updatedAt && (
                                        <div className="date-item">
                                            <span className="date-label">Updated:</span>
                                            <span className="date-value">{formatDate(item.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Inventory;

