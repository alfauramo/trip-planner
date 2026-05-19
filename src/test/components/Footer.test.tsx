import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../../components/Footer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.name': 'TripPlanner',
        'footer.madeBy': 'Made with ❤️',
        'nav.profile': 'Profile',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Footer', () => {
  it('renders app name', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>,
    );
    expect(screen.getByText('TripPlanner')).toBeInTheDocument();
  });

  it('renders made by text', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>,
    );
    expect(screen.getByText('Made with ❤️')).toBeInTheDocument();
  });

  it('renders profile link', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>,
    );
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('has a link to profile page', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>,
    );
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('href', '/profile');
  });
});
