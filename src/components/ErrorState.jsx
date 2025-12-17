import './ErrorState.css';

function ErrorState({ message, onRetry, retryText = 'Try Again' }) {
    return (
        <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Something went wrong</h3>
            <p className="error-message">{message || 'Failed to load content. Please try again.'}</p>
            {onRetry && (
                <button className="error-retry-btn" onClick={onRetry}>
                    {retryText}
                </button>
            )}
        </div>
    );
}

export default ErrorState;

