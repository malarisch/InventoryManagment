import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalSearchModal } from '@/components/search/global-search-modal';

// Mock the company hook
vi.mock('@/app/management/_libs/companyHook', () => ({
  useCompany: vi.fn(() => ({
    company: { id: 1, name: 'Test Company' }
  }))
}));

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [] }))
        }))
      }))
    }))
  }))
}));

describe('GlobalSearchModal', () => {
  it('renders when open', () => {
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByPlaceholderText('Suche in allem...')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<GlobalSearchModal isOpen={false} onClose={vi.fn()} />);
    
    expect(screen.queryByPlaceholderText('Suche in allem...')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside', async () => {
    const onClose = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={onClose} />);
    
    // Click on the backdrop
    fireEvent.mouseDown(document.querySelector('.fixed.inset-0') as Element);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when pressing Escape', async () => {
    const onClose = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={onClose} />);
    
    const input = screen.getByPlaceholderText('Suche in allem...');
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('updates search query when typing', async () => {
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} />);
    
    const input = screen.getByPlaceholderText('Suche in allem...');
    fireEvent.change(input, { target: { value: 'test search' } });
    
    expect(input).toHaveValue('test search');
  });

  it('shows keyboard shortcuts in footer', () => {
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('↑↓ Navigation')).toBeInTheDocument();
    expect(screen.getByText('↵ Öffnen')).toBeInTheDocument();
    expect(screen.getByText('Esc Schließen')).toBeInTheDocument();
  });
});