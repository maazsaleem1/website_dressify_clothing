import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import './HomepageSlider.css';

function HomepageSlider() {
    const navigate = useNavigate();
    const [sliders, setSliders] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const intervalRef = useRef(null);
    const sliderRef = useRef(null);

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
        // Fallback to default hero if no sliders
        return (
            <section className="hero-fullscreen">
                <div className="hero-background-overlay"></div>
                <div className="hero-content-fullscreen">
                    <span className="hero-label">LIMITED TIME</span>
                    <h1 className="hero-title-fullscreen">SALE OF THE SEASON</h1>
                    <Link to="/products" className="hero-link-fullscreen">
                        EXPLORE NOW
                    </Link>
                </div>
            </section>
        );
    }

    const currentSlider = sliders[currentIndex];

    return (
        <div className="slider-container" ref={sliderRef}>
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
                <div className="slider-content">
                    {currentSlider.heading && (
                        <h1 className="slider-heading">{currentSlider.heading}</h1>
                    )}
                    {currentSlider.subheading && (
                        <p className="slider-subheading">{currentSlider.subheading}</p>
                    )}
                    {currentSlider.ctaText && currentSlider.ctaLink && currentSlider.ctaLink.trim() !== '' && (
                        <Link
                            to={currentSlider.ctaLink}
                            className="slider-cta-button"
                        >
                            {currentSlider.ctaText}
                        </Link>
                    )}
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

