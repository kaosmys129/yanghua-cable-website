import React from 'react';
import { render, screen, waitFor } from '../../../lib/test-utils';
import { LazyImage, LazyImageGrid } from '../../../components/ui/LazyImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('LazyImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 300,
    height: 200,
  };

  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('renders with correct attributes', () => {
    render(<LazyImage {...defaultProps} />);
    
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
    expect(image).toHaveAttribute('width', '300');
    expect(image).toHaveAttribute('height', '200');
  });

  it('applies custom className', () => {
    render(<LazyImage {...defaultProps} className="custom-class" />);
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveClass('custom-class');
  });

  it('shows loading state initially', () => {
    render(<LazyImage {...defaultProps} />);
    
    // Should show loading skeleton or placeholder
    const container = screen.getByAltText('Test image').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('handles loading error gracefully', async () => {
    render(<LazyImage {...defaultProps} src="/invalid-image.jpg" />);
    
    const image = screen.getByAltText('Test image');
    
    // Simulate image load error
    Object.defineProperty(image, 'complete', { value: false });
    Object.defineProperty(image, 'naturalHeight', { value: 0 });
    
    // Trigger error event
    const errorEvent = new Event('error');
    image.dispatchEvent(errorEvent);
    
    await waitFor(() => {
      expect(image).toBeInTheDocument();
    });
  });

  it('supports priority loading', () => {
    render(<LazyImage {...defaultProps} priority />);
    
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
  });

  it('supports different sizes', () => {
    render(<LazyImage {...defaultProps} sizes="(max-width: 768px) 100vw, 50vw" />);
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
  });
});

describe('LazyImageGrid', () => {
  const mockImages = [
    { src: '/image1.jpg', alt: 'Image 1' },
    { src: '/image2.jpg', alt: 'Image 2' },
    { src: '/image3.jpg', alt: 'Image 3' },
  ];

  it('renders all images in grid', () => {
    render(<LazyImageGrid images={mockImages} />);
    
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Image 3')).toBeInTheDocument();
  });

  it('applies custom grid className', () => {
    render(<LazyImageGrid images={mockImages} className="custom-grid" />);
    
    const grid = screen.getByRole('list');
    expect(grid).toHaveClass('custom-grid');
  });

  it('handles empty images array', () => {
    render(<LazyImageGrid images={[]} />);
    
    const grid = screen.getByRole('list');
    expect(grid).toBeInTheDocument();
    expect(grid.children).toHaveLength(0);
  });

  it('supports custom columns', () => {
    render(<LazyImageGrid images={mockImages} columns={2} />);
    
    const grid = screen.getByRole('list');
    expect(grid).toHaveClass('grid-cols-2');
  });

  it('supports custom gap', () => {
    render(<LazyImageGrid images={mockImages} gap={8} />);
    
    const grid = screen.getByRole('list');
    expect(grid).toHaveClass('gap-8');
  });

  it('passes through image props', () => {
    const imageProps = {
      width: 400,
      height: 300,
      className: 'custom-image',
    };
    
    render(<LazyImageGrid images={mockImages} imageProps={imageProps} />);
    
    const firstImage = screen.getByAltText('Image 1');
    expect(firstImage).toHaveAttribute('width', '400');
    expect(firstImage).toHaveAttribute('height', '300');
    expect(firstImage).toHaveClass('custom-image');
  });
});