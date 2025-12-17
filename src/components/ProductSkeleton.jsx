import './ProductSkeleton.css';

function ProductSkeleton({ count = 8 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="product-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                        <div className="skeleton-line skeleton-title"></div>
                        <div className="skeleton-line skeleton-price"></div>
                        <div className="skeleton-sizes">
                            <div className="skeleton-size"></div>
                            <div className="skeleton-size"></div>
                            <div className="skeleton-size"></div>
                            <div className="skeleton-size"></div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

export default ProductSkeleton;
