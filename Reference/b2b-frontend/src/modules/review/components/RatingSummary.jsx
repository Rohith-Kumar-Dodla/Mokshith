import RatingStars from './RatingStars.jsx';

const RatingSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <p className="text-4xl font-black text-gray-900">{summary.average}</p>
          <RatingStars rating={Math.round(summary.average)} />
          <p className="text-sm text-gray-500 mt-1">{summary.total} reviews</p>
        </div>
      </div>
      <div className="space-y-2">
        {summary.distribution?.map(({ star, count, percent }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-8">{star}★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-8">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingSummary;
