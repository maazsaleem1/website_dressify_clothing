import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Categories.css';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch categories
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const categoriesList = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesList);

                // Fetch brands
                const brandsSnapshot = await getDocs(collection(db, 'brands'));
                const brandsList = brandsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setBrands(brandsList);
            } catch (error) {
                console.error('Error fetching categories/brands:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="categories-container">
                <div className="loading">Loading categories...</div>
            </div>
        );
    }

    return (
        <div className="categories-container">
            <h1 className="page-title">Categories & Brands</h1>

            <div className="categories-section">
                <h2 className="section-title">Categories</h2>
                {categories.length === 0 ? (
                    <div className="no-items">No categories found.</div>
                ) : (
                    <div className="items-grid">
                        {categories.map((category) => (
                            <div key={category.id} className="category-card">
                                <h3 className="category-name">{category.name || category.id}</h3>
                                <p className="category-id">ID: {category.id}</p>
                                {category.description && (
                                    <p className="category-description">{category.description}</p>
                                )}
                                <Link to={`/products?category=${category.id}`} className="view-link">
                                    View Products →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="brands-section">
                <h2 className="section-title">Brands</h2>
                {brands.length === 0 ? (
                    <div className="no-items">No brands found.</div>
                ) : (
                    <div className="items-grid">
                        {brands.map((brand) => (
                            <div key={brand.id} className="brand-card">
                                <h3 className="brand-name">{brand.name || brand.id}</h3>
                                <p className="brand-id">ID: {brand.id}</p>
                                {brand.description && (
                                    <p className="brand-description">{brand.description}</p>
                                )}
                                <Link to={`/products?brand=${brand.id}`} className="view-link">
                                    View Products →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Categories;

