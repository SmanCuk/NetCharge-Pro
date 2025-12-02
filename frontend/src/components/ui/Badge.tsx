interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'active':
    case 'paid':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
    case 'suspended':
    case 'failed':
      return 'error';
    case 'inactive':
    case 'cancelled':
    case 'refunded':
      return 'default';
    default:
      return 'info';
  }
}
