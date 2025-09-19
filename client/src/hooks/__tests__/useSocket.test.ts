import { renderHook, act } from '@testing-library/react';
import { useSocket } from '../useSocket';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  
  return jest.fn(() => mockSocket);
});

describe('useSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize socket connection', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current).toBeDefined();
    expect(result.current.connected).toBe(true);
  });

  it('should handle socket events', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.emit('test-event', { data: 'test' });
    });

    expect(result.current.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useSocket());

    expect(result.current).toBeDefined();

    unmount();

    // Socket should be cleaned up
    expect(result.current.disconnect).toHaveBeenCalled();
  });
});
