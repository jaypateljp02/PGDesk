import { useAuth } from '../../context/AuthContext';

const Badge = ({ status, showIcon = false }) => {
    const { t } = useAuth();
    const statusConfig = {
        paid: { label: t('paid'), className: 'badge-success' },
        pending: { label: t('pending'), className: 'badge-warning' },
        overdue: { label: t('overdue'), className: 'badge-error' },
        partial: { label: t('partial'), className: 'badge-info' },
        claimed: { label: t('claimed'), className: 'badge-warning' },
        vacant: { label: t('vacant'), className: 'badge-warning' },
        occupied: { label: t('occupied'), className: 'badge-success' }
    };

    const config = statusConfig[status] || { label: status, className: 'badge-info' };

    return (
        <span className={`badge ${config.className}`}>
            {config.label}
        </span>
    );
};

export default Badge;
