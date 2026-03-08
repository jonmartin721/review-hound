import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SourceSearchModal } from './SourceSearchModal';

describe('SourceSearchModal', () => {
  it('saves manually entered source URLs', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <SourceSearchModal
        isOpen
        onClose={vi.fn()}
        businessName="Acme Coffee"
        trustpilotResults={[]}
        bbbResults={[]}
        isLoading={false}
        searchError={null}
        saveError={null}
        onSave={onSave}
        isSaving={false}
      />
    );

    const manualButtons = screen.getAllByRole('button', { name: 'Enter URL manually' });
    await user.click(manualButtons[0]);
    await user.click(manualButtons[1]);

    const inputs = screen.getAllByPlaceholderText('https://...');
    await user.type(inputs[0], 'https://www.trustpilot.com/review/acme.example');
    await user.type(inputs[1], 'https://www.bbb.org/profile/acme');

    await user.click(screen.getByRole('button', { name: 'Save Business' }));

    expect(onSave).toHaveBeenCalledWith({
      trustpilot: 'https://www.trustpilot.com/review/acme.example',
      bbb: 'https://www.bbb.org/profile/acme',
    });
  });

  it('allows skipping source selection', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <SourceSearchModal
        isOpen
        onClose={vi.fn()}
        businessName="Acme Coffee"
        trustpilotResults={[]}
        bbbResults={[]}
        isLoading={false}
        searchError="Search failed"
        saveError={null}
        onSave={onSave}
        isSaving={false}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(onSave).toHaveBeenCalledWith({ trustpilot: null, bbb: null });
  });
});
