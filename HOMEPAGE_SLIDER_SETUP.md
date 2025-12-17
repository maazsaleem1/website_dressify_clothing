# Homepage Slider Setup Guide

## Firestore Collection Structure

Create a collection named `sliders` in your Firebase Firestore database.

### Document Structure

Each document in the `sliders` collection should have the following fields:

```javascript
{
  // Required fields
  imageUrl: "https://your-image-url.com/image.jpg", // String - Full URL to background image (can be Firebase Storage URL)
  heading: "SALE OF THE SEASON", // String - Main heading text
  subheading: "Up to 70% off on selected items", // String - Subheading text (optional but recommended)
  ctaText: "SHOP NOW", // String - Call-to-action button text
  ctaLink: "/products", // String - Link destination (e.g., "/products", "/products?filter=new"). Leave empty or set to "---" to hide button
  status: true, // Boolean - true for active, false for inactive (only active sliders will be displayed)
  
  // Optional fields
  order: 1, // Number - Order in which sliders should appear (lower numbers first)
  createdAt: Timestamp // Firestore Timestamp - Creation date (used for ordering if order is not set)
}
```

**Note:** The component also supports the alternative field names:
- `backgroundImageUrl` (instead of `imageUrl`)
- `displayOrder` (instead of `order`)
- `status: "active"` (string, instead of boolean `true`)

### Example Documents

#### Example 1: Sale Slider
```javascript
{
  imageUrl: "https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/slider1.jpg?alt=media",
  heading: "SUMMER SALE",
  subheading: "Get up to 70% off on summer collection",
  ctaText: "EXPLORE NOW",
  ctaLink: "/products?filter=new",
  status: true,
  order: 1,
  createdAt: Timestamp.now()
}
```

#### Example 2: New Arrivals Slider
```javascript
{
  imageUrl: "https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/slider2.jpg?alt=media",
  heading: "NEW ARRIVALS",
  subheading: "Discover the latest fashion trends",
  ctaText: "SHOP NEW",
  ctaLink: "/products",
  status: true,
  order: 2,
  createdAt: Timestamp.now()
}
```

## Features

### Automatic Features
- **Auto-play**: Sliders automatically advance every 5 seconds
- **Smooth animations**: Fade and scale transitions between slides
- **Progress bar**: Visual indicator showing time until next slide
- **Responsive design**: Fully responsive on all devices

### Manual Controls
- **Navigation arrows**: Previous/Next buttons on desktop
- **Dot indicators**: Click any dot to jump to a specific slide
- **Auto-pause**: Auto-play pauses for 10 seconds after manual navigation

### Fallback Behavior
- If no active sliders are found, displays a default hero section
- If `displayOrder` field is missing, orders by `createdAt` (newest first)
- If both ordering fields are missing, displays sliders in document order

## Firebase Storage Setup

To use Firebase Storage URLs for images:

1. Upload your images to Firebase Storage
2. Get the download URL for each image
3. Use the full URL in the `backgroundImageUrl` field

Alternatively, you can use any publicly accessible image URL.

## Admin Panel Integration

When adding sliders from your admin panel:

1. **Required fields**: `imageUrl`, `heading`, `ctaText`, `status`
2. **Recommended fields**: `subheading`, `order`, `ctaLink`
3. **Status values**: Use `true` (boolean) to show the slider, `false` to hide it. Also supports `"active"` (string) for backward compatibility
4. **Display order**: Use the `order` field with numbers (0, 1, 2, 3...) to control the sequence (lower numbers appear first)
5. **CTA Link**: Set `ctaLink` to a valid route (e.g., "/products") or leave empty/"---" to hide the button

## Testing

1. Create at least one document with `status: "active"` in the `homepageSliders` collection
2. Refresh your homepage to see the slider
3. Add multiple active sliders to test auto-play and navigation
4. Test on mobile devices to ensure responsiveness

## Troubleshooting

- **No sliders showing**: Check that at least one document has `status: true` (boolean) or `status: "active"` (string)
- **Images not loading**: Verify the `imageUrl` (or `backgroundImageUrl`) is a valid, publicly accessible URL
- **Ordering issues**: Add an `order` (or `displayOrder`) field to each document for custom ordering
- **Auto-play not working**: Ensure you have more than one active slider
- **CTA button not showing**: Make sure `ctaLink` is not empty, not "---", and both `ctaText` and `ctaLink` are provided

