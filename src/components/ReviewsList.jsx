import { useEffect, useState } from 'react';
import { getProductReviews, getProductRating } from '../services/reviewService';
import './ReviewsList.css';

function ReviewsList({ productId, onWriteReview }) {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const [reviewsResult, ratingResult] = await Promise.all([
                getProductReviews(productId),
                getProductRating(productId)
            ]);

            if (reviewsResult.success) {
                setReviews(reviewsResult.data || []);
            }

            if (ratingResult.success) {
                setRating({
                    averageRating: ratingResult.averageRating,
                    totalReviews: ratingResult.totalReviews
                });
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderStars = (ratingValue) => {
        return [1, 2, 3, 4, 5].map((star) => (
            <span
                key={star}
                className={`star ${star <= ratingValue ? 'filled' : 'empty'}`}
            >
                {star <= ratingValue ? '★' : '☆'}
            </span>
        ));
    };

    if (loading) {
        return (
            <div className="reviews-section">
                <div className="loading">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div className="reviews-section">
            <div className="reviews-header">
                <h3 className="reviews-title">Customer Reviews</h3>
                <button className="write-review-btn" onClick={onWriteReview}>
                    Write a review
                </button>
            </div>

            {rating.totalReviews > 0 ? (
                <div className="reviews-summary">
                    <div className="rating-display">
                        <div className="average-rating">
                            {rating.averageRating.toFixed(1)}
                        </div>
                        <div className="stars-large">
                            {renderStars(Math.round(rating.averageRating))}
                        </div>
                        <div className="reviews-count">
                            Based on {rating.totalReviews} {rating.totalReviews === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-reviews">
                    <div className="stars-empty">
                        {renderStars(0)}
                    </div>
                    <p className="no-reviews-text">Be the first to write a review</p>
                </div>
            )}

            {reviews.length > 0 && (
                <div className="reviews-list">
                    {reviews.map((review) => (
                        <div key={review.id} className="review-item">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <div className="reviewer-name">{review.customerName}</div>
                                    <div className="review-date">{formatDate(review.createdAt)}</div>
                                </div>
                                <div className="review-rating">
                                    {renderStars(review.rating || 5)}
                                </div>
                            </div>
                            {review.reviewTitle && (
                                <h4 className="review-title">{review.reviewTitle}</h4>
                            )}
                            <p className="review-text">{review.reviewText}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReviewsList;

