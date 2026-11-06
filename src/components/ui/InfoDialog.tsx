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
  open,
  onOpenChange,
  onCloseAutoFocus,
  dismissible = true,
}: PropsWithChildren<{
  trigger?: ReactElement;
  title: string;
  description: string;
  drawer?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
  dismissible?: boolean;
}>) {
  return (
    <Dialog.Root
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          {...(onCloseAutoFocus ? { onCloseAutoFocus } : {})}
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
              disabled={!dismissible}
            >
              <X size={20} aria-hidden="true" />
            </Button>
          </Dialog.Close>
          {children}
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <Button disabled={!dismissible}>Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
