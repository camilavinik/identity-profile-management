import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testContexts } from '../../test/fixtures';
import { mockShowModal, mockDataTransfer } from '../../test/mocks';
import { NameFormModal } from './NameFormModal';

describe('NameFormModal', () => {
  beforeEach(() => {
    // Mock the showModal method for dialogs
    mockShowModal();
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <NameFormModal
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows default title and submit label when open', () => {
    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
      />,
    );

    expect(screen.getByText('Add name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('shows tooltips for context, charset and audio', () => {
    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
      />,
    );

    expect(
      screen.getByText('The situation where this name is used'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The alphabet or set of characters used to write this name',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('An optional recording of how this name is pronounced'),
    ).toBeInTheDocument();
  });

  it('uses custom title and submit label', () => {
    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
        title="Custom Title"
        submitLabel="Custom Submit Label"
      />,
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Custom Submit Label' }),
    ).toBeInTheDocument();
  });

  it('keeps submit disabled until the form is valid', async () => {
    const user = userEvent.setup();
    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    await user.type(
      screen.getByPlaceholderText('latin, hebrew, arabic…'),
      'latin',
    );

    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  it('submits the form and closes on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <NameFormModal
        open
        onClose={onClose}
        onSubmit={onSubmit}
        contexts={testContexts}
      />,
    );

    // Select context and type in charset and value
    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    const [charsetInput, valueInput] = screen.getAllByRole('textbox');
    await user.type(charsetInput, 'latin');
    await user.type(valueInput, 'Test name value');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'legal',
        charset: 'latin',
        value: 'Test name value',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error when submit fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Save failed'));

    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        contexts={testContexts}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    await user.type(
      screen.getByPlaceholderText('latin, hebrew, arabic…'),
      'latin',
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Save failed');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <NameFormModal
        open
        onClose={onClose}
        onSubmit={vi.fn()}
        contexts={testContexts}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows remove-audio option when there is existing audio', () => {
    // Mock the DataTransfer API
    mockDataTransfer();

    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
        currentAudioUrl="https://test.com/test_audio.mp3"
        initialValues={{
          context: 'legal',
          charset: 'latin',
          value: 'Test name value',
        }}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Remove existing audio' }),
    ).toBeInTheDocument();
  });

  it('updates the form when an audio file is selected', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        contexts={testContexts}
      />,
    );

    // Select context and type in charset
    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    await user.type(
      screen.getByPlaceholderText('latin, hebrew, arabic…'),
      'latin',
    );

    // Upload audio file
    const file = new File(['audio'], 'test_audio.mp3', { type: 'audio/mpeg' });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, file);

    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        audioFile: file,
      }),
    );
  });

  it('marks existing audio for removal when the checkbox is checked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    // Mock the DataTransfer API
    mockDataTransfer();

    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        contexts={testContexts}
        currentAudioUrl="https://test.com/test_audio.mp3"
        initialValues={{
          context: 'legal',
          charset: 'latin',
          value: 'Test name value',
        }}
        title="Edit name"
        submitLabel="Save"
      />,
    );

    // Select audio file and check the checkbox
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const checkbox = screen.getByRole('checkbox', {
      name: 'Remove existing audio',
    });
    await user.click(checkbox);

    // Check the checkbox and verify the file input is disabled and the submit button is enabled
    expect(checkbox).toBeChecked();
    expect(fileInput).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Verify the form data
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        removeAudio: true,
        audioFile: null,
      }),
    );
  });

  it('shows a generic error when submit fails with a string error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue('Save failed error');

    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        contexts={testContexts}
      />,
    );

    // Select context and type in charset and submit
    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    await user.type(
      screen.getByPlaceholderText('latin, hebrew, arabic…'),
      'latin',
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    // Verify the error message
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('clears the audio file when the file input is cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        contexts={testContexts}
      />,
    );

    // Select context and type in charset
    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    await user.type(
      screen.getByPlaceholderText('latin, hebrew, arabic…'),
      'latin',
    );

    // Upload audio file
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' });
    await user.upload(fileInput, file);

    // Clear the file input and submit the form
    fireEvent.change(fileInput, { target: { files: null } });
    await user.click(screen.getByRole('button', { name: 'Add' }));

    // Verify the form data
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        audioFile: null,
      }),
    );
  });

  it('unchecks remove audio checkbox and keeps a previously selected file', async () => {
    const user = userEvent.setup();

    // Mock the DataTransfer API
    mockDataTransfer();

    // Select context and type in charset
    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
        currentAudioUrl="https://test.com/test_audio.mp3"
        initialValues={{
          context: 'legal',
          charset: 'latin',
          value: 'Test name value',
        }}
        title="Edit name"
        submitLabel="Save"
      />,
    );

    // Select audio file
    const checkbox = screen.getByRole('checkbox', {
      name: 'Remove existing audio',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Check the checkbox and verify the file input is disabled
    await user.click(checkbox);
    expect(fileInput).toBeDisabled();

    // Uncheck the checkbox and verify the file input is enabled
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(fileInput).toBeEnabled();
  });

  it('keeps submit disabled when editing without changes', () => {
    render(
      <NameFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        contexts={testContexts}
        title="Edit name"
        submitLabel="Save"
        initialValues={{
          context: 'legal',
          charset: 'latin',
          value: 'Test name value',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
