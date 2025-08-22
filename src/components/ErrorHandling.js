import React, { useState } from 'react';

/**
 * Comprehensive error display component with retry functionality
 * @param {Object} props - Component props
 * @param {Error|string} props.error - Error object or message
 * @param {Function} props.onRetry - Retry function
 * @param {Function} props.onDismiss - Dismiss error function
 * @param {string} props.context - Context where error occurred
 * @param {Object} props.suggestions - Suggested actions
 */
function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  context = 'operation',
  onDateClick
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An unknown error occurred';
  const isNetworkError = /network|fetch|cors|connection/i.test(errorMessage);
  const isValidationError = /validation|invalid|format/i.test(errorMessage);
  const isDynamicFetchError = /dynamic fetch|source/i.test(errorMessage);

  /**
   * Handle retry with loading state and exponential backoff
   */
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);

    try {
      // Add slight delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Get error-specific icon
   */
  const getErrorIcon = () => {
    if (isNetworkError) return '🌐';
    if (isValidationError) return '⚠️';
    if (isDynamicFetchError) return '🔄';
    return '❌';
  };

  /**
   * Render formatted error message with clickable date links
   */
  const renderFormattedErrorMessage = (message) => {
    // Split message into lines for better formatting
    const lines = message.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if this line contains suggested dates
      const datePattern = /(\d{4}-\d{2}-\d{2})/g;
      const dates = line.match(datePattern);
      
      if (dates && dates.length > 0) {
        // This line contains dates - make them clickable
        let formattedLine = line;
        
        dates.forEach(date => {
          const clickableDate = `<span class="clickable-date" data-date="${date}">${date}</span>`;
          formattedLine = formattedLine.replace(date, clickableDate);
        });
        
        return (
          <div key={lineIndex} className="error-line">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </div>
        );
      } else {
        // Regular line
        return (
          <div key={lineIndex} className="error-line">
            {line}
          </div>
        );
      }
    });
  };



  /**
   * Get retry button text based on state
   */
  const getRetryButtonText = () => {
    if (isRetrying) return '🔄 Retrying...';
    if (retryCount === 0) return '🔄 Try Again';
    if (retryCount === 1) return '🔄 Retry';
    return `🔄 Retry (${retryCount})`;
  };

  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-header">
          <span className="error-icon">{getErrorIcon()}</span>
          <span className="error-title">
            {isDynamicFetchError ? 'Dynamic Fetch Failed' : 
             isNetworkError ? 'Connection Problem' :
             isValidationError ? 'Data Format Issue' :
             'Something Went Wrong'}
          </span>
        </div>

        <div 
          className="error-message"
          onClick={(e) => {
            if (e.target.classList.contains('clickable-date') && onDateClick) {
              const date = e.target.getAttribute('data-date');
              if (date) {
                onDateClick(date);
              }
            }
          }}
        >
          {renderFormattedErrorMessage(errorMessage)}
        </div>

        {context && (
          <div className="error-context">
            <strong>Context:</strong> {context}
          </div>
        )}

        <div className="error-actions">
          {onRetry && (
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className={`retry-button ${isRetrying ? 'retrying' : ''}`}
            >
              {getRetryButtonText()}
            </button>
          )}

          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="dismiss-button"
            >
              ✕ Dismiss
            </button>
          )}
        </div>

        {retryCount > 2 && (
          <div className="error-help">
            <p><strong>Still having trouble?</strong></p>
            <p>
              This error has occurred {retryCount} times. You might want to:
            </p>
            <ul>
              <li>Try a different date</li>
              <li>Use manual word input</li>
              <li>Check back later</li>
            </ul>
          </div>
        )}
      </div>

      <style>{`
        .error-container {
          background: #fee2e2;
          border: 2px solid #dc2626;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          max-width: 600px;
        }

        .error-content {
          color: #7f1d1d;
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: bold;
          font-size: 18px;
        }

        .error-icon {
          font-size: 24px;
        }

        .error-message {
          background: #fef2f2;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          border-left: 4px solid #dc2626;
          line-height: 1.6;
        }

        .error-line {
          margin-bottom: 6px;
          text-align: left;
        }

        .error-line:last-child {
          margin-bottom: 0;
        }

        .error-line:first-child {
          font-weight: 600;
          margin-bottom: 12px;
        }

        .clickable-date {
          color: #2563eb;
          cursor: pointer;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s;
          padding: 0;
          background: none;
        }

        .clickable-date:hover {
          color: #1d4ed8;
          text-decoration: none;
        }

        .error-context {
          margin-bottom: 12px;
          font-size: 14px;
          color: #991b1b;
        }

        .error-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        }

        .retry-button:hover:not(:disabled) {
          background: #b91c1c;
        }

        .retry-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .retry-button.retrying {
          animation: pulse 1.5s infinite;
        }

        .dismiss-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        }

        .dismiss-button:hover {
          background: #4b5563;
        }

        .error-help {
          background: #fef2f2;
          padding: 12px;
          border-radius: 4px;
          border-left: 4px solid #f59e0b;
          margin-top: 16px;
        }

        .error-help p {
          margin: 0 0 8px 0;
        }

        .error-help ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/**
 * Success message component for completed operations
 */
function SuccessMessage({ 
  message, 
  onDismiss, 
  autoHide = true, 
  hideAfter = 5000,
  actions = [] 
}) {
  const [visible, setVisible] = useState(true);

  React.useEffect(() => {
    if (autoHide && hideAfter > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, hideAfter);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideAfter, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div className="success-container">
      <div className="success-content">
        <div className="success-header">
          <span className="success-icon">✅</span>
          <span className="success-title">Success!</span>
        </div>

        <div className="success-message">
          {message}
        </div>

        {actions.length > 0 && (
          <div className="success-actions">
            {actions.map((action, index) => (
              <button 
                key={index}
                onClick={action.onClick}
                className="success-action-button"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {onDismiss && (
          <button 
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="success-dismiss-button"
          >
            ✕
          </button>
        )}
      </div>

      <style>{`
        .success-container {
          background: #d1fae5;
          border: 2px solid #059669;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          max-width: 600px;
          position: relative;
        }

        .success-content {
          color: #064e3b;
        }

        .success-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: bold;
          font-size: 18px;
        }

        .success-icon {
          font-size: 24px;
        }

        .success-message {
          background: #ecfdf5;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 12px;
          border-left: 4px solid #059669;
        }

        .success-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .success-action-button {
          background: #059669;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        }

        .success-action-button:hover {
          background: #047857;
        }

        .success-dismiss-button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #064e3b;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .success-dismiss-button:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export { ErrorDisplay, SuccessMessage };
export default ErrorDisplay;
