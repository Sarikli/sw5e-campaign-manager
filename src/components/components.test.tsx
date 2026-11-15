import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('renders title, body and action', async () => {
    const onAction = jest.fn();
    await render(<EmptyState title="Nothing" body="Add one" actionLabel="Add" onAction={onAction} />);
    expect(screen.getByText('Nothing')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(onAction).toHaveBeenCalled();
  });
});
