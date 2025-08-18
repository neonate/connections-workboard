import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Connections Workboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to your connections management application/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('renders workboard section', () => {
  render(<App />);
  const workboardElement = screen.getByText(/Workboard/i);
  expect(workboardElement).toBeInTheDocument();
});
