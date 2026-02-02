import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        whatsapp: 'btn-whatsapp',
        outline: 'btn-outline',
        ghost: 'btn-ghost'
    };

    const sizes = {
        sm: 'text-sm py-2 px-3',
        md: 'py-3 px-4',
        lg: 'text-lg py-4 px-6'
    };

    return (
        <button
            className={`btn ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : icon ? (
                icon
            ) : null}
            {children}
        </button>
    );
};

export default Button;
