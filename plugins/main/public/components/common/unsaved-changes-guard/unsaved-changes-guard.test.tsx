import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  UnsavedChangesGuardedFlyout,
  useReportUnsavedChanges,
  useUnsavedChangesGuard,
} from './unsaved-changes-guard';

const DirtyReporter = ({ dirty }: { dirty: boolean }) => {
  useReportUnsavedChanges(dirty);
  return null;
};

const GuardedActionButton = ({ onAction }: { onAction: () => void }) => {
  const { guardAction } = useUnsavedChangesGuard();
  return <button onClick={() => guardAction(onAction)}>guarded action</button>;
};

const closeFlyout = () =>
  fireEvent.click(
    document.querySelector(
      '[data-test-subj="euiFlyoutCloseButton"]',
    ) as Element,
  );

describe('UnsavedChangesGuardedFlyout', () => {
  it('closes directly and runs guarded actions while nothing is dirty', () => {
    const onClose = jest.fn();
    const onAction = jest.fn();
    render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <DirtyReporter dirty={false} />
        <GuardedActionButton onAction={onAction} />
      </UnsavedChangesGuardedFlyout>,
    );

    fireEvent.click(screen.getByText('guarded action'));
    expect(onAction).toHaveBeenCalledTimes(1);

    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();
  });

  it('asks for confirmation while a descendant reports unsaved changes', () => {
    const onClose = jest.fn();
    render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <DirtyReporter dirty={true} />
      </UnsavedChangesGuardedFlyout>,
    );

    closeFlyout();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Unsubmitted changes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'There are unsaved changes. Are you sure you want to proceed?',
      ),
    ).toBeInTheDocument();
    // The highlighted (filled/confirm) button is the safe choice.
    expect(
      document.querySelector('[data-test-subj="confirmModalConfirmButton"]'),
    ).toHaveTextContent("No, don't do it");
    expect(
      document.querySelector('[data-test-subj="confirmModalCancelButton"]'),
    ).toHaveTextContent('Yes, do it');

    fireEvent.click(screen.getByText("No, don't do it"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();

    closeFlyout();
    fireEvent.click(screen.getByText('Yes, do it'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();
  });

  it('treats ESC and the dialog X as dismiss, not as discard', () => {
    const onClose = jest.fn();
    render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <DirtyReporter dirty={true} />
      </UnsavedChangesGuardedFlyout>,
    );

    // ESC on the dialog (the reflex after ESC opened it) must keep the form.
    closeFlyout();
    fireEvent.keyDown(screen.getByText('Unsubmitted changes'), {
      key: 'Escape',
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();

    // The dialog's own X close icon must keep the form too.
    closeFlyout();
    fireEvent.click(document.querySelector('.euiModal__closeIcon') as Element);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();

    // Still dirty: the guard keeps prompting, and only "Yes, do it" discards.
    closeFlyout();
    fireEvent.click(screen.getByText('Yes, do it'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps guarding while any of several owners is dirty', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <DirtyReporter dirty={true} />
        <DirtyReporter dirty={false} />
      </UnsavedChangesGuardedFlyout>,
    );

    closeFlyout();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("No, don't do it"));

    rerender(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <DirtyReporter dirty={false} />
        <DirtyReporter dirty={false} />
      </UnsavedChangesGuardedFlyout>,
    );
    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clears the unsaved-changes entry when a dirty owner unmounts', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <DirtyReporter dirty={true} />
      </UnsavedChangesGuardedFlyout>,
    );

    rerender(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <span>no reporter</span>
      </UnsavedChangesGuardedFlyout>,
    );
    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is a no-op without a guarded flyout above', () => {
    const onAction = jest.fn();
    render(
      <>
        <DirtyReporter dirty={true} />
        <GuardedActionButton onAction={onAction} />
      </>,
    );

    fireEvent.click(screen.getByText('guarded action'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();
  });
});
