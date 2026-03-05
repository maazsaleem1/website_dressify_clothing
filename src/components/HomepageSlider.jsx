import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartDrawer } from '../contexts/CartDrawerContext';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import './HomepageSlider.css';

function HomepageSlider() {
    const navigate = useNavigate();
    const { openCartDrawer } = useCartDrawer();
    const [sliders, setSliders] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isHeaderSolid, setIsHeaderSolid] = useState(false);
    const intervalRef = useRef(null);
    const sliderRef = useRef(null);

    const HeroNav = () => (
        <>
            <div className="hero-topbar">
                FREE SHIPPING ON ORDERS OVER RS. 2,999
            </div>
            <header className={`hero-header ${isHeaderSolid ? 'hero-header-solid' : ''}`}>
                <div className="hero-header-left">
                    <button
                        type="button"
                        className="hero-icon-button hero-icon-button-left"
                        aria-label="Search products"
                        onClick={() => navigate('/products')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="hero-icon-svg">
                            <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <circle cx="11" cy="11" r="5.2" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                    </button>
                    <nav className="hero-nav-links" aria-label="Main navigation">
                        <button type="button" className="hero-nav-link hero-nav-link-highlight" onClick={() => navigate('/products')}>NEW SP '26 COLLECTION</button>
                        <button type="button" className="hero-nav-link" onClick={() => navigate('/products?category=men')}>MEN</button>
                    </nav>
                </div>
                <div className="hero-logo">Dressify</div>
                <div className="hero-header-actions">
                    <button type="button" className="hero-icon-button" aria-label="Account" onClick={() => navigate('/account')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="hero-icon-svg">
                            <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M5.5 19.2C6.7 16.8 9.1 15.3 12 15.3C14.9 15.3 17.3 16.8 18.5 19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button type="button" className="hero-icon-button" aria-label="Shopping bag" onClick={openCartDrawer}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="hero-icon-svg">
                            <path d="M7 8L6.3 18.2C6.2 19.2 7 20 8 20H16C17 20 17.8 19.2 17.7 18.2L17 8H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M9.5 11C9.5 9.6 10.6 8.5 12 8.5C13.4 8.5 14.5 9.6 14.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M8 8H16L15.2 5.5C15 4.9 14.5 4.5 13.8 4.5H10.2C9.5 4.5 9 4.9 8.8 5.5L8 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </header>
        </>
    );

    const HeroContent = ({ heading, subheading }) => (
        <div className="slider-content hero-main">
            <span className="hero-label">{subheading || "NEW SP '26 COLLECTION ONLINE NOW"}</span>
            <h1 className="hero-title-fullscreen">{heading || 'MOMENTS TO MEMORIES'}</h1>
            <div className="hero-cta-row">
                <Link to="/products?category=men" className="hero-cta-button">SHOP MEN</Link>
            </div>
        </div>
    );

    useEffect(() => {
        const fetchSliders = async () => {
            try {
                setLoading(true);
                const slidersCollection = collection(db, 'sliders');

                // Fetch all documents (no complex queries to avoid index requirements)
                const snapshot = await getDocs(slidersCollection);
                let slidersList = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        // Map field names to match component expectations
                        backgroundImageUrl: data.imageUrl || data.backgroundImageUrl,
                        heading: data.heading,
                        subheading: data.subheading,
                        ctaText: data.ctaText,
                        ctaLink: data.ctaLink && data.ctaLink.trim() !== '' && data.ctaLink !== '---' ? data.ctaLink : null,
                        status: data.status,
                        displayOrder: data.order !== undefined ? data.order : data.displayOrder,
                        createdAt: data.createdAt,
                        // Keep original data for reference
                        ...data
                    };
                });

                // Filter client-side for active status (supports both boolean true and string "active")
                slidersList = slidersList.filter(slider =>
                    slider.status === true || slider.status === 'active' ||
                    (slider.status === undefined && slider.id) // Include if status is undefined (backward compatibility)
                );

                // Sort client-side by order/displayOrder if available, otherwise by createdAt
                slidersList.sort((a, b) => {
                    // First try displayOrder (mapped from order field)
                    const orderA = a.displayOrder !== undefined ? a.displayOrder : (a.order !== undefined ? a.order : Infinity);
                    const orderB = b.displayOrder !== undefined ? b.displayOrder : (b.order !== undefined ? b.order : Infinity);

                    if (orderA !== Infinity && orderB !== Infinity) {
                        return orderA - orderB;
                    }
                    if (orderA !== Infinity) return -1;
                    if (orderB !== Infinity) return 1;

                    // Then try createdAt (newest first if no order)
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return dateB - dateA;
                });

                setSliders(slidersList);
            } catch (error) {
                console.error('Error fetching sliders:', error);
                // Set empty array on error to prevent crashes
                setSliders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSliders();
    }, []);

    // Header: white when scrolled down, transparent when near top
    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setIsHeaderSolid(y > 80);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-play functionality
    useEffect(() => {
        if (sliders.length <= 1 || !isAutoPlaying) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % sliders.length);
        }, 5000); // Change slide every 5 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [sliders.length, isAutoPlaying]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? sliders.length - 1 : prevIndex - 1
        );
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % sliders.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const handleSliderClick = (slider, e) => {
        // Prevent navigation if clicking on CTA button or navigation controls
        if (e && (e.target.closest('.slider-cta-button') || e.target.closest('.slider-nav') || e.target.closest('.slider-dot'))) {
            return;
        }

        // Priority order: multiple products > single product > category > brand > custom filter > CTA link
        if (slider.productIds && Array.isArray(slider.productIds) && slider.productIds.length > 0) {
            // Multiple products - show all selected products
            const productIdsParam = slider.productIds.join(',');
            navigate(`/products?ids=${productIdsParam}`);
            return;
        }

        if (slider.productId) {
            // Single product - navigate to product detail page
            navigate(`/products/${slider.productId}`);
            return;
        }

        if (slider.categoryId) {
            // Navigate to category page with filter
            navigate(`/products?category=${slider.categoryId}`);
            return;
        }

        if (slider.brandId) {
            // Navigate to brand page with filter
            navigate(`/products?brand=${slider.brandId}`);
            return;
        }

        if (slider.filterQuery) {
            // Navigate to products page with search
            navigate(`/products?search=${encodeURIComponent(slider.filterQuery)}`);
            return;
        }

        // Fallback to CTA link
        if (slider.ctaLink && slider.ctaLink.trim() !== '') {
            if (slider.ctaLink.startsWith('http')) {
                window.open(slider.ctaLink, '_blank');
            } else {
                navigate(slider.ctaLink);
            }
        }
    };

    if (loading) {
        return (
            <div className="slider-container">
                <div className="slider-loading">Loading slider...</div>
            </div>
        );
    }

    if (sliders.length === 0) {
        // Fallback to static hero if no sliders exist
        return (
            <div className="slider-container" ref={sliderRef}>
                <HeroNav />
                <div
                    className="slider-slide slider-slide-static"
                    style={{
                        backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                    }}
                >
                    <div className="slider-overlay"></div>
                    <div className="hero-shell">
                        <HeroContent
                            heading="MOMENTS TO MEMORIES"
                            subheading="WHEN SPRING BEGINS, NORMAL DAYS TURN INTO SOMETHING MORE..."
                        />
                    </div>
                </div>
            </div>
        );
    }

    const currentSlider = sliders[currentIndex];

    return (
        <div className="slider-container" ref={sliderRef}>
            <HeroNav />
            <div
                className="slider-slide"
                onClick={(e) => handleSliderClick(currentSlider, e)}
                style={{
                    backgroundImage: currentSlider.backgroundImageUrl
                        ? `url(${currentSlider.backgroundImageUrl})`
                        : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                    cursor: 'pointer',
                }}
            >
                <div className="slider-overlay"></div>
                <div className="hero-shell">
                    <HeroContent
                        heading={currentSlider.heading}
                        subheading={currentSlider.subheading}
                    />
                </div>
            </div>

            {/* Navigation Arrows */}
            {sliders.length > 1 && (
                <>
                    <button
                        className="slider-nav slider-nav-prev"
                        onClick={goToPrevious}
                        aria-label="Previous slide"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        className="slider-nav slider-nav-next"
                        onClick={goToNext}
                        aria-label="Next slide"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {sliders.length > 1 && (
                <div className="slider-dots">
                    {sliders.map((_, index) => (
                        <button
                            key={index}
                            className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            {sliders.length > 1 && isAutoPlaying && (
                <div className="slider-progress">
                    <div
                        className="slider-progress-bar"
                        key={currentIndex} // Reset animation on slide change
                    />
                </div>
            )}
        </div>
    );
}

export default HomepageSlider;

