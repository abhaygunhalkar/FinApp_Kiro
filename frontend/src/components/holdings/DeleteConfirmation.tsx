import { DeleteConfirmation as SharedDeleteConfirmation } from '../shared';
import { useDeleteHolding } from '../../hooks/useHoldings';
import type { Holding } from '../../types';

interface HoldingDeleteConfirmationProps {
  holding: Holding;
  onClose: () => void;
}

export default function HoldingDeleteConfirmation({
  holding,
  onClose,
}: HoldingDeleteConfirmationProps) {
  const deleteMutation = useDeleteHolding();

  async function handleConfirm() {
    try {
      await deleteMutation.mutateAsync(holding.id);
      onClose();
    } catch {
      // Error is handled by the mutation's onError or displayed via ErrorNotification
      onClose();
    }
  }

  return (
    <SharedDeleteConfirmation
      title="Delete Holding"
      message={`Are you sure you want to delete your ${holding.ticker}${holding.company_name ? ` (${holding.company_name})` : ''} holding? This will also remove all associated transactions. This action cannot be undone.`}
      onConfirm={handleConfirm}
      onCancel={onClose}
      confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
    />
  );
}
