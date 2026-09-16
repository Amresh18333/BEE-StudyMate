import "./UIStates.css";


export function LoadingState({
    message = "Loading...",
    size = "medium"
}) {
    return (
        <div className={`loading-state loading-state-${size}`}>
            <div className="loading-spinner" />
            <p>{message}</p>
        </div>
    );
}


export function ErrorState({
    title = "Something went wrong",
    message = "An unexpected error occurred.",
    onRetry,
    retryLabel = "Try Again",
    icon = "!"
}) {
    return (
        <div className="error-state">
            <div className="error-state-icon">
                {icon}
            </div>
            <div className="error-state-content">
                <h2>{title}</h2>
                <p>{message}</p>
                {onRetry && (
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={onRetry}
                    >
                        {retryLabel}
                    </button>
                )}
            </div>
        </div>
    );
}


export function EmptyState({
    title = "Nothing here yet",
    message = "Get started by creating your first item.",
    icon = "○",
    action,
    actionLabel
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                {icon}
            </div>
            <div className="empty-state-content">
                <h3>{title}</h3>
                <p>{message}</p>
                {action && actionLabel && (
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={action}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}


export function PageLoading({
    message = "Loading page..."
}) {
    return (
        <div className="page-loading">
            <LoadingState message={message} size="large" />
        </div>
    );
}


export function PageError({
    title = "Unable to load page",
    message = "Something went wrong while loading this page.",
    onRetry
}) {
    return (
        <div className="page-error">
            <ErrorState
                title={title}
                message={message}
                onRetry={onRetry}
            />
        </div>
    );
}


export function PageEmpty({
    title = "No content",
    message = "There's nothing to show here yet.",
    icon = "○",
    action,
    actionLabel
}) {
    return (
        <div className="page-empty">
            <EmptyState
                title={title}
                message={message}
                icon={icon}
                action={action}
                actionLabel={actionLabel}
            />
        </div>
    );
}