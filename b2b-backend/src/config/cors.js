import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5173', // Common Vite default
  'http://127.0.0.1:5173',
  /\.vercel\.app$/, // Allow all Vercel deployments
  'https://mokshith-entreprises.vercel.app' // Add your specific production URL here
];

export const corsConfig = cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    if (!isAllowed) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
});