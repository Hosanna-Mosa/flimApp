import { useCallback } from 'react';
import { Alert } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Promise-based native confirm. Replaces the repeated
 * `Alert.alert(title, msg, [{Cancel}, {Delete, style: 'destructive', onPress}])`
 * shape so call sites read as `if (await confirm({...})) { ... }`.
 */
export function useConfirm() {
  return useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        Alert.alert(opts.title, opts.message, [
          { text: opts.cancelLabel ?? 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: opts.confirmLabel ?? 'Confirm',
            style: opts.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ]);
      }),
    []
  );
}
