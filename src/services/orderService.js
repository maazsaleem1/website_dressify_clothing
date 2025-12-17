import {
    collection,
    addDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
};

// Create order from cart
export const createOrder = async (cartItems, customerInfo, paymentInfo) => {
    try {
        const ordersCollection = collection(db, 'orders');

        const orderData = {
            orderNumber: generateOrderNumber(),
            customerId: customerInfo.customerId || null,
            customer: {
                name: customerInfo.name || '',
                email: customerInfo.email || '',
                phone: customerInfo.phone || ''
            },
            items: cartItems.map(item => ({
                productName: item.productName,
                sku: item.sku,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                imageUrl: item.imageUrl,
                inventoryId: item.inventoryId
            })),
            totalAmount: cartItems.reduce((sum, item) =>
                sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 0)), 0
            ),
            paymentMethod: paymentInfo.method || 'Cash on Delivery',
            paymentStatus: paymentInfo.status || 'Pending',
            status: 'Pending',
            shippingAddress: customerInfo.address || '',
            trackingNumber: null,
            notes: customerInfo.notes || '',
            orderDate: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(ordersCollection, orderData);

        return {
            success: true,
            data: {
                id: docRef.id,
                ...orderData
            }
        };
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

