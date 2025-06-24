import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../layout/Header'

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = require('../../hooks/useAuth').useAuth

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseAuth.mockReset()
  })

  it('renders header with logo', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByText('AI E-Learning')).toBeInTheDocument()
  })

  it('shows unauthenticated navigation links', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    })

    render(<Header />)
    
    // Should show login/register links
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    
    // Should show public navigation
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    
    // Should NOT show authenticated links
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('My Learning')).not.toBeInTheDocument()
  })

  it('shows authenticated navigation links', () => {
    const mockLogout = jest.fn()
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })

    render(<Header />)
    
    // Should show authenticated navigation
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Learning')).toBeInTheDocument()
    
    // Should show user info
    expect(screen.getByText('test')).toBeInTheDocument() // email prefix
    
    // Should show logout button
    expect(screen.getByText('Logout')).toBeInTheDocument()
    
    // Should NOT show login/register links
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
  })

  it('handles logout click', () => {
    const mockLogout = jest.fn()
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })

    render(<Header />)
    
    // Click logout button
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('toggles mobile menu', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    })

    render(<Header />)
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('Open main menu')).toBeInTheDocument()
    
    // Click mobile menu button
    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    fireEvent.click(menuButton)
    
    // Mobile menu content should now be visible
    // Note: We check for additional instances that appear in mobile menu
    const coursesLinks = screen.getAllByText('Courses')
    expect(coursesLinks.length).toBeGreaterThan(1) // Desktop + mobile versions
  })

  it('displays user email prefix correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'john.doe@example.com' },
      isAuthenticated: true,
      logout: jest.fn(),
    })

    render(<Header />)
    
    // Should display username part before @ symbol
    expect(screen.getByText('john.doe')).toBeInTheDocument()
  })

  it('handles missing user email gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { email: null },
      isAuthenticated: true,
      logout: jest.fn(),
    })

    render(<Header />)
    
    // Should not crash when email is null
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})