import { Link } from 'react-router-dom';
import './EmptyState.css';

function EmptyState({ 
    title = 'No products found', 
    message = 'We couldn\'t find any products matching your criteria.',
    actionText = 'Browse All Products',
    actionLink = '/products',
    icon = '🔍'
}) {
    return (
        <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <h3 className="empty-title">{title}</h3>
            <p className="empty-message">{message}</p>
            {actionLink && (
                <Link to={actionLink} className="empty-action-btn">
                    {actionText}
                </Link>
            )}
        </div>
    );
}

export default EmptyState;

