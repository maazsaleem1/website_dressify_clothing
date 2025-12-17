import {
    collection,
    doc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Get reviews for a product
export const getProductReviews = async (productId) => {
    try {
        const reviewsCollection = collection(db, 'reviews');

        // Use query without orderBy to avoid index requirement
        // We'll sort client-side instead
        const q = query(
            reviewsCollection,
            where('productId', '==', productId),
            where('status', '==', 'approved')
        );

        const snapshot = await getDocs(q);
        let reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort client-side by createdAt (newest first)
        reviews.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return dateB - dateA; // Descending order (newest first)
        });

        return { success: true, data: reviews };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        // If query still fails, return empty array
        return { success: false, error: error.message, data: [] };
    }
};

// Submit a new review
export const submitReview = async (reviewData) => {
    try {
        const reviewsCollection = collection(db, 'reviews');

        const newReview = {
            productId: reviewData.productId,
            productName: reviewData.productName || '',
            customerName: reviewData.customerName,
            customerEmail: reviewData.customerEmail,
            rating: parseInt(reviewData.rating) || 5,
            reviewTitle: reviewData.reviewTitle || '',
            reviewText: reviewData.reviewText,
            status: 'pending', // Admin can approve/reject reviews
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(reviewsCollection, newReview);
        return {
            success: true,
            data: { id: docRef.id, ...newReview }
        };
    } catch (error) {
        console.error('Error submitting review:', error);
        return { success: false, error: error.message };
    }
};

// Calculate average rating for a product
export const getProductRating = async (productId) => {
    try {
        const result = await getProductReviews(productId);
        if (result.success && result.data.length > 0) {
            const reviews = result.data;
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            const averageRating = totalRating / reviews.length;
            return {
                success: true,
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                totalReviews: reviews.length
            };
        }
        return { success: true, averageRating: 0, totalReviews: 0 };
    } catch (error) {
        console.error('Error calculating rating:', error);
        return { success: false, averageRating: 0, totalReviews: 0 };
    }
};

