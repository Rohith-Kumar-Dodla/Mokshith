export const performanceMetrics = {
  successRate: 94.5,
  averageRating: 4.7,
  onTimeDeliveries: 92,
  completedDeliveries: 1250,
  cancelledDeliveries: 45,
  customerSatisfaction: 96,
  totalDistance: 12500,
  averageDeliveryTime: 38
};

export const performanceTrends = [
  { month: 'Jan', successRate: 92, rating: 4.5, deliveries: 180 },
  { month: 'Feb', successRate: 93, rating: 4.6, deliveries: 195 },
  { month: 'Mar', successRate: 91, rating: 4.5, deliveries: 175 },
  { month: 'Apr', successRate: 94, rating: 4.7, deliveries: 210 },
  { month: 'May', successRate: 95, rating: 4.8, deliveries: 235 },
  { month: 'Jun', successRate: 94.5, rating: 4.7, deliveries: 255 }
];

export const achievements = [
  {
    id: 1,
    title: 'Top Performer',
    description: 'Achieved top performer status for May 2024',
    icon: '🏆',
    achieved: true,
    achievedDate: '2024-05-31'
  },
  {
    id: 2,
    title: '100 Deliveries Completed',
    description: 'Successfully completed 100 deliveries',
    icon: '🎯',
    achieved: true,
    achievedDate: '2024-03-15'
  },
  {
    id: 3,
    title: '5-Star Rating',
    description: 'Maintained 5-star rating for 30 consecutive days',
    icon: '⭐',
    achieved: true,
    achievedDate: '2024-04-20'
  },
  {
    id: 4,
    title: 'Perfect Delivery Week',
    description: 'Completed all deliveries on time for a week',
    icon: '📅',
    achieved: true,
    achievedDate: '2024-05-10'
  },
  {
    id: 5,
    title: '500 Deliveries Milestone',
    description: 'Reached 500 total deliveries',
    icon: '🚀',
    achieved: true,
    achievedDate: '2024-02-28'
  },
  {
    id: 6,
    title: '1000 Deliveries Milestone',
    description: 'Reached 1000 total deliveries',
    icon: '🎉',
    achieved: true,
    achievedDate: '2024-05-25'
  },
  {
    id: 7,
    title: 'Customer Favorite',
    description: 'Received 100+ positive reviews',
    icon: '❤️',
    achieved: false,
    achievedDate: null
  },
  {
    id: 8,
    title: 'Distance Champion',
    description: 'Covered 10,000+ km total distance',
    icon: '📍',
    achieved: true,
    achievedDate: '2024-05-15'
  }
];

export const deliveryTrendData = [
  { date: '2024-05-27', deliveries: 12, successful: 11, failed: 1 },
  { date: '2024-05-28', deliveries: 15, successful: 15, failed: 0 },
  { date: '2024-05-29', deliveries: 14, successful: 13, failed: 1 },
  { date: '2024-05-30', deliveries: 10, successful: 9, failed: 1 },
  { date: '2024-05-31', deliveries: 16, successful: 16, failed: 0 },
  { date: '2024-06-01', deliveries: 13, successful: 13, failed: 0 },
  { date: '2024-06-02', deliveries: 14, successful: 14, failed: 0 },
  { date: '2024-06-03', deliveries: 15, successful: 15, failed: 0 },
  { date: '2024-06-04', deliveries: 12, successful: 11, failed: 1 },
  { date: '2024-06-05', deliveries: 16, successful: 16, failed: 0 }
];

export const ratingDistribution = [
  { rating: 5, count: 850 },
  { rating: 4, count: 320 },
  { rating: 3, count: 60 },
  { rating: 2, count: 15 },
  { rating: 1, count: 5 }
];
