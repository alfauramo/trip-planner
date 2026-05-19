import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/Toast';

vi.mock('../../hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

function TestConsumer() {
  const { showToast } = useToast();
  return <button onClick={() => showToast('Test message', 'success')}>Show Toast</button>;
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders and shows toast on trigger', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Show Toast').click();
    });

    expect(screen.getByText('Test message')).toBeDefined();
  });

  it('removes toast after 4 seconds', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Show Toast').click();
    });

    expect(screen.getByText('Test message')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Test message')).toBeNull();
  });

  it('shows error type toast with red background', () => {
    function ErrorConsumer() {
      const { showToast } = useToast();
      return <button onClick={() => showToast('Error!', 'error')}>Show Error</button>;
    }

    render(
      <ToastProvider>
        <ErrorConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Show Error').click();
    });

    const toastEl = screen.getByText('Error!').closest('[class*="bg-red-500"]');
    expect(toastEl).toBeDefined();
  });

  it('throws error when useToast is used outside provider', () => {
    function BadConsumer() {
      useToast();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow('useToast must be used within a ToastProvider');
  });
});
