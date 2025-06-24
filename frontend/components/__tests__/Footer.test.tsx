import { render, screen } from '@testing-library/react'
import { Footer } from '../layout/Footer'

describe('Footer Component', () => {
  it('renders footer with company information', () => {
    render(<Footer />)
    
    expect(screen.getByText('AI E-Learning Platform')).toBeInTheDocument()
    expect(screen.getByText(/Empowering developers to master AI\/ML/)).toBeInTheDocument()
  })

  it('displays platform navigation links', () => {
    render(<Footer />)
    
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Browse Courses')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
    expect(screen.getByText('About Us')).toBeInTheDocument()
  })

  it('displays support navigation links', () => {
    render(<Footer />)
    
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
    expect(screen.getByText('Help Center')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('displays social media links', () => {
    render(<Footer />)
    
    // Check for social media links by their sr-only text content
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('Twitter')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('displays copyright information', () => {
    render(<Footer />)
    
    expect(screen.getByText('© 2025 AI E-Learning Platform. All rights reserved.')).toBeInTheDocument()
  })

  it('has correct link hrefs', () => {
    render(<Footer />)
    
    // Check some key navigation links
    const coursesLink = screen.getByText('Browse Courses').closest('a')
    expect(coursesLink).toHaveAttribute('href', '/courses')
    
    const pricingLink = screen.getByText('Pricing').closest('a')
    expect(pricingLink).toHaveAttribute('href', '/pricing')
    
    const contactLink = screen.getByText('Contact Us').closest('a')
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('has proper semantic structure', () => {
    render(<Footer />)
    
    // Should be wrapped in a footer element
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    
    // Should have proper heading hierarchy
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('AI E-Learning Platform')
    expect(screen.getByRole('heading', { level: 4, name: 'Platform' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Support' })).toBeInTheDocument()
  })
})