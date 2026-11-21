import { Button } from '@/ui';

type ActivityCompleteButtonProps = {
  completed: boolean;
  loading: boolean;
  onClick: () => void;
  label: string;
  loadingLabel: string;
  completedLabel: string;
};

export const ActivityCompleteButton = ({
  completed,
  loading,
  onClick,
  label,
  loadingLabel,
  completedLabel,
}: ActivityCompleteButtonProps) => (
  <Button
    disabled={completed || loading}
    onClick={onClick}
    className="w-full rounded-xl disabled:cursor-not-allowed disabled:bg-green-600"
  >
    {completed ? completedLabel : loading ? loadingLabel : label}
  </Button>
);
