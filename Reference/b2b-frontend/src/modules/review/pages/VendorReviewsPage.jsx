import { useState } from 'react';
import { useReviews } from '../hooks/useReviews.js';
import RatingSummary from '../components/RatingSummary.jsx';
import ReviewDetailModal from '../components/ReviewDetailModal.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import RatingStars from '../components/RatingStars.jsx';
import { Star, AlertCircle } from 'lucide-react';
import '../../admin/pages/AdminShared.css';

const VendorReviewsPage = () => {
  const { reviews, summary, loading, error, selectedReview, setSelectedReview } = useReviews();
  const [modalOpen, setModalOpen] = useState(false);

  const handleReviewClick = (review) => {
    setSelectedReview(review);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="admin-page-content py-16 text-center text-gray-500">Loading reviews...</div>;
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Product Reviews</h1>
          <p className="page-subtitle">Customer feedback and ratings for your products</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-red-600 py-8 justify-center">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <RatingSummary summary={summary} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          {reviews.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" description="Reviews from customers will appear here." />
          ) : (
            reviews.map((review) => (
              <div
                key={review._id}
                className="admin-card p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleReviewClick(review)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleReviewClick(review)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{review.userId?.name}</p>
                    <p className="text-sm text-gray-500">{review.productName}</p>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="text-gray-600 line-clamp-2">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <ReviewDetailModal
        review={selectedReview}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedReview(null); }}
      />
    </div>
  );
};

export default VendorReviewsPage;
