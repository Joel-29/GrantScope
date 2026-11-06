import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { PropsWithChildren, ReactElement } from 'react';
import { Button } from './Button';

export function InfoDialog({
  trigger,
  title,
  description,
  children,
  drawer = false,
}: PropsWithChildren<{
  trigger: ReactElement;
  title: string;
  description: string;
  drawer?: boolean;
}>) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={
            drawer ? 'dialog-content activity-drawer' : 'dialog-content'
          }
        >
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          <Dialog.Description className="dialog-description">
            {description}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="dialog-close"
              aria-label="Close dialog"
            >
              <X size={20} aria-hidden="true" />
            </Button>
          </Dialog.Close>
          {children}
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <Button>Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
