import Modal from '../../../components/ui/Modal.jsx';
import RatingStars from './RatingStars.jsx';

const ReviewDetailModal = ({ review, isOpen, onClose }) => {
  if (!review) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Details">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">{review.userId?.name || 'Anonymous'}</p>
            <p className="text-sm text-gray-500">{review.productName || 'Product'}</p>
          </div>
          <RatingStars rating={review.rating} />
        </div>
        <p className="text-gray-700 leading-relaxed">{review.comment || 'No comment provided.'}</p>
        <p className="text-xs text-gray-400">
          {new Date(review.createdAt).toLocaleString()}
        </p>
      </div>
    </Modal>
  );
};

export default ReviewDetailModal;
