import { render, screen, act, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search callbacks by 300ms', async () => {
    const onSearch = vi.fn();

    const { container } = render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search products...');
    // Use fireEvent to trigger React change handlers.
    await act(async () => {
      fireEvent.input(input, { target: { value: 'rice' } });
    });

    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith('rice');
  });

  it('clears search immediately', async () => {
    const onSearch = vi.fn();

    const { container } = render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search products...');
    await act(async () => {
      fireEvent.input(input, { target: { value: 'rice' } });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Click the clear button within the component container (avoids other page buttons).
    const root = container.firstChild;
    const clearBtn = within(root).getByRole('button');
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    expect(onSearch).toHaveBeenLastCalledWith('');
  });
});
