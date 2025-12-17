import { useState } from 'react';
import { submitReview } from '../services/reviewService';
import './ReviewForm.css';

function ReviewForm({ productId, productName, onClose, onReviewSubmitted }) {
    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        rating: 0,
        reviewTitle: '',
        reviewText: ''
    });
    const [hoveredRating, setHoveredRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({
            ...prev,
            rating: rating
        }));
    };

    const handleRatingHover = (rating) => {
        setHoveredRating(rating);
    };

    const handleRatingLeave = () => {
        setHoveredRating(0);
    };

    const validateForm = () => {
        if (!formData.customerName.trim()) {
            setError('Please enter your name');
            return false;
        }
        if (!formData.customerEmail.trim()) {
            setError('Please enter your email');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (formData.rating === 0) {
            setError('Please select a rating');
            return false;
        }
        if (!formData.reviewText.trim()) {
            setError('Please write your review');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const result = await submitReview({
                productId,
                productName,
                ...formData
            });

            if (result.success) {
                if (onReviewSubmitted) {
                    onReviewSubmitted();
                }
                onClose();
                alert('Thank you for your review! It will be published after approval.');
            } else {
                setError(result.error || 'Failed to submit review. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const displayRating = hoveredRating || formData.rating;

    return (
        <div className="review-form-container">
            <div className="review-form-header">
                <h3>Customer Reviews</h3>
                <button className="cancel-review-btn" onClick={onClose}>
                    Cancel review
                </button>
            </div>

            <form className="review-form" onSubmit={handleSubmit}>
                <div className="form-field">
                    <label htmlFor="customerName">
                        NAME <span className="field-note">(DISPLAYED PUBLICLY LIKE John Smith)</span>
                    </label>
                    <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="Enter your name (public)"
                        required
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="customerEmail">EMAIL</label>
                    <input
                        type="email"
                        id="customerEmail"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        placeholder="Enter your email (private)"
                        required
                    />
                </div>

                <div className="form-field">
                    <label>RATING</label>
                    <div
                        className="rating-stars-input"
                        onMouseLeave={handleRatingLeave}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`star-btn ${star <= displayRating ? 'filled' : ''}`}
                                onClick={() => handleRatingClick(star)}
                                onMouseEnter={() => handleRatingHover(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="reviewTitle">REVIEW TITLE</label>
                    <input
                        type="text"
                        id="reviewTitle"
                        name="reviewTitle"
                        value={formData.reviewTitle}
                        onChange={handleInputChange}
                        placeholder="Give your review a title"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="reviewText">REVIEW</label>
                    <textarea
                        id="reviewText"
                        name="reviewText"
                        value={formData.reviewText}
                        onChange={handleInputChange}
                        placeholder="Write your comments here"
                        rows="6"
                        required
                    />
                </div>

                <div className="data-usage-notice">
                    <p>
                        How we use your data: We'll only contact you about the review you left, and only if necessary.
                        By submitting your review, you agree to our terms, privacy and content policies.
                    </p>
                </div>

                {error && (
                    <div className="review-error">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="submit-review-btn"
                    disabled={submitting}
                >
                    {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                </button>
            </form>
        </div>
    );
}

export default ReviewForm;

