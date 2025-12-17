import { useState, useRef, useEffect } from 'react';
import './LazyImage.css';

function LazyImage({ src, alt, className, placeholder, ...props }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    return (
        <div ref={imgRef} className={`lazy-image-container ${className || ''}`}>
            {!isInView && (
                <div className="lazy-image-placeholder">
                    {placeholder || <div className="lazy-image-skeleton"></div>}
                </div>
            )}
            {isInView && (
                <>
                    {!isLoaded && (
                        <div className="lazy-image-placeholder">
                            {placeholder || <div className="lazy-image-skeleton"></div>}
                        </div>
                    )}
                    <img
                        src={src}
                        alt={alt}
                        className={`lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
                        onLoad={handleLoad}
                        onError={handleError}
                        loading="lazy"
                        {...props}
                    />
                    {hasError && (
                        <div className="lazy-image-error">
                            <span>Image not available</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default LazyImage;

