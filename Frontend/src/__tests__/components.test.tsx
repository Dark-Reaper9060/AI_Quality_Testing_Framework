import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/button';

describe('UI Components', () => {
  it('should render Button component', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('should apply variant classes correctly', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByText('Outline Button');
    expect(button).toHaveClass('border-input', 'bg-background');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });
});
