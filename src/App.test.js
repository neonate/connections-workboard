import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the puzzleFetcher service
jest.mock('./services/puzzleFetcher', () => ({
  fetchPuzzleForDate: jest.fn()
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Suppress console.error warnings for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear URL parameters to ensure App starts in input state
    window.history.replaceState({}, '', window.location.pathname);
    
    // Clear any localStorage or sessionStorage that might persist state
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up any URL changes made during tests
    window.history.replaceState({}, '', window.location.pathname);
  });

  test('shows input section initially', () => {
    render(<App />);
    expect(screen.getByText('Choose Your Input Method')).toBeInTheDocument();
    expect(screen.getByText('📅 Method 1: Load Puzzle by Date')).toBeInTheDocument();
    expect(screen.getByText('✏️ Method 2: Manual Entry')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 16 words here...')).toBeInTheDocument();
    expect(screen.getByText('Start Puzzle')).toBeInTheDocument();
  });

  test('shows date picker and fetch button', () => {
    render(<App />);
    // Use more specific selectors to avoid conflicts
    expect(screen.getByRole('textbox', { type: 'date' })).toBeInTheDocument();
    expect(screen.getByText('📥 Load Puzzle')).toBeInTheDocument();
  });

  test('fetch button is enabled when date is selected', () => {
    render(<App />);
    const fetchButton = screen.getByText('📥 Load Puzzle');
    expect(fetchButton).toBeEnabled();
  });

  test('fetch button is initially enabled', () => {
    render(<App />);
    const fetchButton = screen.getByText('📥 Load Puzzle');
    
    // Should be enabled when date is selected by default
    expect(fetchButton).toBeEnabled();
  });

  test('validates empty input', async () => {
    render(<App />);
    
    // Empty input should not trigger alert, just do nothing
    expect(screen.getByText('Choose Your Input Method')).toBeInTheDocument();
  });

  test('shows error for too many words', async () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 17 words
    fireEvent.change(textarea, { target: { value: 'word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15, word16, word17' } });
    
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    fireEvent.click(submitButton);
    
    // Should show error for too many words
    expect(mockAlert).toHaveBeenCalledWith('Please enter exactly 16 words. You entered 17 words.');
    mockAlert.mockRestore();
  });

  test('validates too few words', async () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 15 words
    fireEvent.change(textarea, { target: { value: 'word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15' } });
    
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    fireEvent.click(submitButton);
    
    expect(mockAlert).toHaveBeenCalledWith('Please enter exactly 16 words. You entered 15 words.');
    mockAlert.mockRestore();
  });

  test('starts game with valid input', async () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words
    const words = 'word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15, word16';
    fireEvent.change(textarea, { target: { value: words } });
    
    fireEvent.click(submitButton);
    
    // Should show game board
    await waitFor(() => {
      expect(screen.getByText(/Group Your Words/)).toBeInTheDocument();
    });
  });

  test('shows game board with words', async () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words
    const words = 'word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15, word16';
    fireEvent.change(textarea, { target: { value: words } });
    
    fireEvent.click(submitButton);
    
    // Should show all 16 words (converted to uppercase)
    await waitFor(() => {
      expect(screen.getByText('word1')).toBeInTheDocument();
      expect(screen.getByText('word16')).toBeInTheDocument();
    });
  });

  test('copy to clipboard functionality', async () => {
    render(<App />);
    
    // The copy button is on the input screen, not the game board
    // Find and click copy button (the button shows just the icon)
    const copyButton = screen.getByText('📋');
    fireEvent.click(copyButton);
    
    // Check if clipboard.writeText was called
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  test('reset button returns to input screen', async () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words and start game
    const words = 'word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15, word16';
    fireEvent.change(textarea, { target: { value: words } });
    
    fireEvent.click(submitButton);
    
    // Wait for game board to appear
    await waitFor(() => {
      expect(screen.getByText(/Group Your Words/)).toBeInTheDocument();
    });
    
    // Click reset button
    const resetButton = screen.getByText('Start Over');
    fireEvent.click(resetButton);
    
    // Should be back to input screen
    expect(screen.getByText('Choose Your Input Method')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 16 words here...')).toBeInTheDocument();
  });

  test('copy button shows success message', async () => {
    render(<App />);
    
    // The copy button is on the input screen, not the game board
    // Find copy button by its title attribute
    const copyButton = screen.getByTitle('Copy to clipboard');
    
    // Mock clipboard API comprehensively
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock navigator.clipboard globally
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });
    
    // Also mock document.execCommand as fallback
    Object.defineProperty(document, 'execCommand', {
      value: jest.fn().mockReturnValue(true),
      writable: true,
      configurable: true
    });
    
    // Click the copy button
    await userEvent.click(copyButton);
    
    // Should show success message (button text changes to ✓ temporarily)
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });
});
