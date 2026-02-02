const Input = ({
    label,
    error,
    prefix,
    suffix,
    className = '',
    ...props
}) => {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <div className="relative">
                {prefix && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {prefix}
                    </div>
                )}
                <input
                    className={`input ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {suffix}
                    </div>
                )}
            </div>
            {error && <span className="text-sm text-error">{error}</span>}
        </div>
    );
};

export default Input;
