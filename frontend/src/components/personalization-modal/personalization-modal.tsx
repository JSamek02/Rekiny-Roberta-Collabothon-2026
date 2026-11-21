'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui';

type PersonalizationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const PersonalizationModal = ({
  open,
  onOpenChange,
  onSave,
  onCancel,
}: PersonalizationModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-blue-950">Personalization</DialogTitle>
      </DialogHeader>

      <div className="min-h-24" />

      <DialogFooter className="border-blue-100 bg-blue-50/70">
        <DialogClose asChild>
          <Button variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="solid" size="md" onClick={onSave}>
            Save
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
