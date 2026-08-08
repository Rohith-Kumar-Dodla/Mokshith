import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImageUpload from '../../components/common/ImageUpload';
import uploadService from '../../services/uploadService';

vi.mock('../../services/uploadService', () => ({
  default: {
    uploadImage: vi.fn(),
  },
}));

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows uploaded image URL after successful upload instead of Preview placeholder', async () => {
    uploadService.uploadImage.mockResolvedValue({
      url: 'https://cdn.example.com/products/rice.jpg',
      publicId: 'products/rice',
    });

    const onChange = vi.fn();
    const onUploaded = vi.fn();

    render(
      <ImageUpload
        label="Product Image"
        onChange={onChange}
        onUploaded={onUploaded}
        autoUpload
      />
    );

    const file = new File(['fake-image'], 'rice.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadService.uploadImage).toHaveBeenCalled();
    });

    await waitFor(() => {
      const img = screen.getByAltText('Product Image');
      expect(img).toHaveAttribute('src', 'https://cdn.example.com/products/rice.jpg');
    });

    expect(screen.getByText('Uploaded image')).toBeInTheDocument();
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    expect(onUploaded).toHaveBeenCalledWith({
      url: 'https://cdn.example.com/products/rice.jpg',
      publicId: 'products/rice',
    });
  });

  it('shows upload error and keeps selected preview on failure', async () => {
    uploadService.uploadImage.mockRejectedValue(new Error('upload failed'));
    const onChange = vi.fn();

    render(<ImageUpload label="Product Image" onChange={onChange} autoUpload />);

    const file = new File(['fake-image'], 'rice.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    expect(screen.getByAltText('Selected Product Image')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(file);
  });
});
