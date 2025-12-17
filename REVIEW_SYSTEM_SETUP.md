# Review System Setup Guide

## Firestore Collection Structure

Create a collection named `reviews` in your Firebase Firestore database.

### Document Structure

Each review document should have the following fields:

```javascript
{
  // Required fields
  productId: "product_id_from_inventory", // String - Reference to product
  productName: "Product Name", // String - Product name (for reference)
  customerName: "John Smith", // String - Customer name (displayed publicly)
  customerEmail: "john@example.com", // String - Customer email (private)
  rating: 5, // Number - Rating from 1 to 5
  reviewText: "Great product! Highly recommended.", // String - Review content
  status: "approved", // String - "pending", "approved", or "rejected"
  
  // Optional fields
  reviewTitle: "Amazing quality!", // String - Review title
  createdAt: Timestamp, // Firestore Timestamp - When review was created
  updatedAt: Timestamp // Firestore Timestamp - When review was last updated
}
```

### Review Status Values

- **pending**: New review awaiting admin approval (not shown to users)
- **approved**: Review approved by admin (shown to users)
- **rejected**: Review rejected by admin (not shown to users)

## Features

### Review Display
- Shows average rating and total review count
- Displays all approved reviews
- Shows reviewer name, date, rating, and review text
- Empty state when no reviews exist

### Review Form
- Customer name (displayed publicly)
- Customer email (private)
- Star rating (1-5 stars)
- Review title (optional)
- Review text (required)
- Data usage notice
- Form validation

### Admin Workflow
1. Customer submits review → Status: "pending"
2. Admin reviews in Firestore
3. Admin changes status to "approved" → Review appears on website
4. Or admin changes status to "rejected" → Review hidden

## Example Review Document

```javascript
{
  productId: "GT4CvMMGWHKvn1gDNIvj",
  productName: "Checkin product",
  customerName: "John Smith",
  customerEmail: "john@example.com",
  rating: 5,
  reviewTitle: "Excellent quality!",
  reviewText: "This product exceeded my expectations. The quality is outstanding and it fits perfectly. Highly recommended!",
  status: "approved",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

## Firestore Index

If you want to query reviews by productId and status with ordering, you may need to create a composite index:

**Collection**: `reviews`
**Fields**: 
- `productId` (Ascending)
- `status` (Ascending)
- `createdAt` (Descending)

The system will work without the index (it fetches all and filters client-side), but the index improves performance.

## How It Works

1. **User clicks "Write a review"** → Review form appears
2. **User fills form and submits** → Review saved to Firestore with status "pending"
3. **Admin approves review** → Changes status to "approved" in Firestore
4. **Review appears on product page** → Only approved reviews are displayed
5. **Average rating calculated** → Based on all approved reviews

## Testing

1. Go to any product detail page
2. Scroll to "Customer Reviews" section
3. Click "Write a review" button
4. Fill in the form and submit
5. Check Firestore `reviews` collection - review should be there with status "pending"
6. Change status to "approved" in Firestore
7. Refresh product page - review should appear

## Notes

- Reviews require admin approval before appearing (status must be "approved")
- Only approved reviews are displayed to users
- Average rating is calculated from approved reviews only
- Reviews are sorted by newest first

