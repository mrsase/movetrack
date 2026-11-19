import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from './ItemForm';
import { ToastProvider } from '../components/Toast';
import type { Nav } from '../nav';

vi.mock('../api', () => ({
  api: {
    createItem: vi.fn(),
    updateItem: vi.fn(),
    item: vi.fn(),
  },
}));

import { api } from '../api';
import type { Item } from '../types';

function makeNav(over: Partial<Nav> = {}): Nav {
  return {
    route: { name: 'item-new' },
    push: vi.fn(),
    pop: vi.fn(),
    replace: vi.fn(),
    goTab: vi.fn(),
    ...over,
  };
}

function renderForm(nav: Nav) {
  return render(
    <ToastProvider>
      <ItemForm nav={nav} />
    </ToastProvider>,
  );
}

describe('ItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    const nav = makeNav();
    renderForm(nav);

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(await screen.findByText(/give it a name/i)).toBeInTheDocument();
    expect(api.createItem).not.toHaveBeenCalled();
  });

  it('submits with defaults and navigates to the created item', async () => {
    const user = userEvent.setup();
    const nav = makeNav();
    const created: Item = {
      id: 42,
      name: 'Dell dock',
      category: 'mac',
      serial: null,
      quantity: 1,
      notes: null,
      destination: null,
      status: 'in_office',
      box_id: null,
      created_at: '2026-08-31T12:00:00.000Z',
      updated_at: '2026-08-31T12:00:00.000Z',
    };
    vi.mocked(api.createItem).mockResolvedValue(created);

    renderForm(nav);
    await user.type(screen.getByPlaceholderText(/MacBook Pro/), 'Dell dock');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(api.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dell dock',
        category: 'other',
        quantity: 1,
        status: undefined,
      }),
    );
    await screen.findByText(/Added/);
    expect(nav.replace).toHaveBeenCalledWith({ name: 'item', id: 42 });
  });

  it('respects category chips and quantity stepper', async () => {
    const user = userEvent.setup();
    const nav = makeNav();
    vi.mocked(api.createItem).mockResolvedValue({
      id: 1,
      name: 'Cables',
      category: 'cable',
      serial: null,
      quantity: 3,
      notes: null,
      destination: null,
      status: 'in_office',
      box_id: null,
      created_at: '2026-08-31T12:00:00.000Z',
      updated_at: '2026-08-31T12:00:00.000Z',
    });

    renderForm(nav);
    await user.type(screen.getByPlaceholderText(/MacBook Pro/), 'Cables');
    await user.click(screen.getByRole('button', { name: 'Cable' }));
    await user.click(screen.getByRole('button', { name: 'Increase' }));
    await user.click(screen.getByRole('button', { name: 'Increase' }));
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(api.createItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Cables', category: 'cable', quantity: 3 }),
    );
  });
});