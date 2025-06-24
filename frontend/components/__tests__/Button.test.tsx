import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/Button'

describe('Button Component', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary')

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent')

    rerender(<Button variant="danger">Danger</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-600')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')

    rerender(<Button size="md">Medium</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-12')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('shows loading spinner when loading is true', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toBeInTheDocument()
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('prevents click when loading', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Button</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current?.textContent).toBe('Ref Button')
  })

  it('passes through HTML button attributes', () => {
    render(
      <Button 
        type="submit" 
        data-testid="test-button"
        aria-label="Test button"
      >
        Submit
      </Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('data-testid', 'test-button')
    expect(button).toHaveAttribute('aria-label', 'Test button')
  })

  it('has proper accessibility attributes', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button')
    
    // Should have focus management
    expect(button).toHaveClass('focus-visible:outline-none')
    expect(button).toHaveClass('focus-visible:ring-2')
  })
})