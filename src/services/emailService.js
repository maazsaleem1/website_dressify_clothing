import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
    serviceId: 'service_nzioc7a',
    templateId: 'template_e7ha0k3',
    publicKey: 'hV25LzOUnqnnf2yMr'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

/**
 * Send order confirmation email
 * @param {Object} orderData - Order data from Firestore
 * @param {Array} orderItems - Array of order items
 * @param {Object} costs - Shipping, tax, and total costs
 * @param {string} customerEmail - Customer email address
 * @returns {Promise<Object>} Success/error result
 */
export const sendOrderConfirmationEmail = async (orderData, orderItems, costs, customerEmail) => {
    try {
        // Format order items for EmailJS template
        // Ensure image URLs are absolute and valid
        const orders = orderItems.map(item => {
            // Get image URL - ensure it's absolute
            let imageUrl = item.imageUrl || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
                // If relative URL, make it absolute (though this shouldn't happen)
                imageUrl = `https://${imageUrl}`;
            }
            // Fallback to placeholder if no image
            if (!imageUrl || imageUrl.trim() === '') {
                imageUrl = 'https://via.placeholder.com/64x64?text=No+Image';
            }

            return {
                image_url: imageUrl,
                name: item.productName || 'Product',
                units: item.quantity || 1,
                price: formatPrice(item.unitPrice || 0)
            };
        });

        // Prepare template parameters
        // EmailJS Handlebars supports nested objects with dot notation
        // Template uses {{cost.shipping}}, {{cost.tax}}, {{cost.total}}
        // IMPORTANT: EmailJS requires nested objects to be passed as actual objects, not strings
        const templateParams = {
            order_id: orderData.orderNumber || orderData.id,
            orders: orders, // Array for {{#orders}} loop
            // Nested object for {{cost.shipping}}, {{cost.tax}}, {{cost.total}}
            // EmailJS Handlebars supports nested objects with dot notation
            // Pass as actual nested object structure
            cost: {
                shipping: formatPrice(costs.shipping || 0),
                tax: formatPrice(costs.tax || 0),
                total: formatPrice(costs.total || 0)
            },
            email: customerEmail,
            website_link: window.location.origin || 'https://dressify.com'
        };

        // Log for debugging
        console.log('Email template parameters:', {
            order_id: templateParams.order_id,
            orders_count: orders.length,
            orders_sample: orders[0],
            cost_shipping: costs.shipping,
            cost_tax: costs.tax,
            cost_total: costs.total,
            email: templateParams.email
        });

        // Send email using EmailJS
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            templateParams
        );

        console.log('Order confirmation email sent successfully:', response);
        return {
            success: true,
            message: 'Order confirmation email sent successfully'
        };
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return {
            success: false,
            error: error.message || 'Failed to send confirmation email'
        };
    }
};

/**
 * Format price for email (returns formatted number with commas)
 * @param {number|string} price - Price value
 * @returns {string} Formatted price with commas (e.g., "3,000")
 */
const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    // Return formatted number with commas - template should add "Rs." prefix
    // Example: 3000 becomes "3,000"
    return numPrice.toLocaleString('en-PK');
};

/**
 * Send custom email using EmailJS
 * @param {Object} templateParams - Template parameters
 * @param {string} templateId - EmailJS template ID (optional, uses default if not provided)
 * @returns {Promise<Object>} Success/error result
 */
export const sendEmail = async (templateParams, templateId = null) => {
    try {
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            templateId || EMAILJS_CONFIG.templateId,
            templateParams
        );

        return {
            success: true,
            message: 'Email sent successfully',
            response: response
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }
};

