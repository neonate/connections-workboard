import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock console.error to avoid noise during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('App Component', () => {
  test('renders header correctly', () => {
    render(<App />);
    expect(screen.getByText('NYT Connections Working Board')).toBeInTheDocument();
  });

  test('shows input section initially', () => {
    render(<App />);
    expect(screen.getByText('Enter Puzzle Words')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 16 words here...')).toBeInTheDocument();
    expect(screen.getByText('Start Puzzle')).toBeInTheDocument();
  });

  test('shows ChatGPT instructions', () => {
    render(<App />);
    expect(screen.getByText(/Pro Tip: Use ChatGPT to Get Words/)).toBeInTheDocument();
    expect(screen.getByText('Take a screenshot')).toBeInTheDocument();
  });

  test('validates 16 words requirement', () => {
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Try with only 15 words
    fireEvent.change(textarea, { target: { value: 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15' } });
    fireEvent.click(submitButton);
    
    expect(alertSpy).toHaveBeenCalledWith('Please enter exactly 16 words separated by commas or new lines.');
    alertSpy.mockRestore();
  });

  test('validates empty input', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Try with empty input
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    // Empty input should not trigger alert, just do nothing
    expect(screen.getByText('Enter Puzzle Words')).toBeInTheDocument();
  });

  test('validates too many words', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Try with 17 words
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16,WORD17';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Should start game successfully since extra words get sliced off
    expect(screen.getByText('Group Your Words (4 groups of 4)')).toBeInTheDocument();
  });

  test('starts game with 16 valid words', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Should show game board
    expect(screen.getByText('Group Your Words (4 groups of 4)')).toBeInTheDocument();
    expect(screen.getByText('Reset Board')).toBeInTheDocument();
  });

  test('displays word tiles in grid', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Check that words are displayed
    expect(screen.getByText('WORD1')).toBeInTheDocument();
    expect(screen.getByText('WORD16')).toBeInTheDocument();
  });

  test('shows group areas', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Check group areas exist
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('Group 3')).toBeInTheDocument();
    expect(screen.getByText('Group 4')).toBeInTheDocument();
  });

  test('reset button returns to input screen', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Start game
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Click reset
    const resetButton = screen.getByText('Reset Board');
    fireEvent.click(resetButton);
    
    // Should be back to input screen
    expect(screen.getByText('Enter Puzzle Words')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 16 words here...')).toBeInTheDocument();
  });

  test('handles different word separators', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words with mixed separators
    const words = 'WORD1\nWORD2,WORD3\nWORD4,WORD5\nWORD6,WORD7\nWORD8,WORD9\nWORD10,WORD11\nWORD12,WORD13\nWORD14,WORD15\nWORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Should start game successfully
    expect(screen.getByText('Group Your Words (4 groups of 4)')).toBeInTheDocument();
  });

  test('handles words with extra whitespace', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Enter 16 words with extra whitespace
    const words = '  WORD1  ,  WORD2  ,  WORD3  ,  WORD4  ,  WORD5  ,  WORD6  ,  WORD7  ,  WORD8  ,  WORD9  ,  WORD10  ,  WORD11  ,  WORD12  ,  WORD13  ,  WORD14  ,  WORD15  ,  WORD16  ';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Should start game successfully
    expect(screen.getByText('Group Your Words (4 groups of 4)')).toBeInTheDocument();
  });

  test('copy button functionality', async () => {
    render(<App />);
    
    const copyButton = screen.getByTitle('Copy to clipboard');
    expect(copyButton).toBeInTheDocument();
    
    // Mock clipboard API
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });
    
    fireEvent.click(copyButton);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      "I have a screenshot of today's NYT Connections puzzle. Can you identify all 16 words in the grid and list them separated by commas? Just the words, nothing else."
    );
  });

  test('word tiles have proper drag attributes', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Start game
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Check that word tiles have drag attributes
    const wordTiles = screen.getAllByText(/WORD\d+/);
    wordTiles.forEach(tile => {
      expect(tile).toHaveAttribute('draggable', 'true');
    });
  });

  test('group areas have proper drop zones', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Enter 16 words here...');
    const submitButton = screen.getByText('Start Puzzle');
    
    // Start game
    const words = 'WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8,WORD9,WORD10,WORD11,WORD12,WORD13,WORD14,WORD15,WORD16';
    fireEvent.change(textarea, { target: { value: words } });
    fireEvent.click(submitButton);
    
    // Check that group areas exist and are properly structured
    const groupAreas = screen.getAllByText(/Group \d+/);
    expect(groupAreas).toHaveLength(4);
    
    groupAreas.forEach(group => {
      const groupContainer = group.closest('.group-area');
      expect(groupContainer).toBeInTheDocument();
    });
  });
});

// Quick utility function tests
describe('Utility Functions', () => {
  test('word parsing handles various separators', () => {
    const testInput = 'WORD1,WORD2\nWORD3,WORD4';
    const words = testInput.split(/[,\n]+/).map(word => word.trim()).filter(word => word.length > 0);
    expect(words).toEqual(['WORD1', 'WORD2', 'WORD3', 'WORD4']);
  });

  test('word filtering works correctly', () => {
    const testWords = ['WORD1', '', 'WORD2', '   ', 'WORD3'];
    const filtered = testWords.filter(word => word.trim().length > 0);
    expect(filtered).toEqual(['WORD1', 'WORD2', 'WORD3']);
  });

  test('word trimming works correctly', () => {
    const testWords = ['  WORD1  ', '  WORD2  ', '  WORD3  '];
    const trimmed = testWords.map(word => word.trim());
    expect(trimmed).toEqual(['WORD1', 'WORD2', 'WORD3']);
  });
});
