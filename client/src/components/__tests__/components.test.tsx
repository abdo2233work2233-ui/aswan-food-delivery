import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';
import { SuccessMessage } from '../SuccessMessage';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { Tooltip } from '../Tooltip';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false }, action) => state,
      ui: (state = { theme: 'light', language: 'ar' }, action) => state,
    },
    preloadedState: initialState,
  });
};

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});

describe('Input Component', () => {
  it('should render correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    input.value = 'test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should show error state', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});

describe('Modal Component', () => {
  it('should render when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    closeButton.click();
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('LoadingSpinner Component', () => {
  it('should render correctly', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show custom message', () => {
    render(<LoadingSpinner message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('ErrorMessage Component', () => {
  it('should render error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should not render when message is empty', () => {
    render(<ErrorMessage message="" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('SuccessMessage Component', () => {
  it('should render success message', () => {
    render(<SuccessMessage message="Success!" />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should not render when message is empty', () => {
    render(<SuccessMessage message="" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Card Component', () => {
  it('should render correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(<Card title="Card Title">Card content</Card>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });
});

describe('Badge Component', () => {
  it('should render correctly', () => {
    render(<Badge>Badge text</Badge>);
    expect(screen.getByText('Badge text')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});

describe('Avatar Component', () => {
  it('should render correctly', () => {
    render(<Avatar src="avatar.jpg" alt="User avatar" />);
    expect(screen.getByAltText('User avatar')).toBeInTheDocument();
  });

  it('should render with fallback text', () => {
    render(<Avatar fallback="AM" />);
    expect(screen.getByText('AM')).toBeInTheDocument();
  });
});

describe('Tooltip Component', () => {
  it('should render correctly', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
});