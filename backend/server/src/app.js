const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiLogger = require('./middlewares/apiLogger.middleware');
const errorHandler = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const authV1Routes = require('./routes/v1/auth.routes');

const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const communityRoutes = require('./routes/community.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const likeRoutes = require('./routes/like.routes');
const followRoutes = require('./routes/follow.routes');
const commentRoutes = require('./routes/comment.routes');
const shareRoutes = require('./routes/share.routes');
const feedRoutes = require('./routes/feed.routes');
const mediaRoutes = require('./routes/media.routes');
const adminAuthRoutes = require('./routes/adminAuth.routes');
const adminVerificationRoutes = require('./routes/adminVerification.routes');
const verificationRoutes = require('./routes/verification.routes');
const supportRoutes = require('./routes/support.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const walletRoutes = require('./routes/wallet.routes');
const moderationRoutes = require('./routes/moderation.routes');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://filmyconnect24.com',
  'https://admin.filmyconnect24.com',
  'https://api.filmyconnect24.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(apiLogger);
app.use(require('./middlewares/requestLogger.middleware'));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/auth', authV1Routes);
app.use('/auth', authRoutes);

app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/media', mediaRoutes);
app.use('/api/communities', communityRoutes);
app.use('/messages', messageRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api', likeRoutes);         // /api/posts/:id/like, etc.
app.use('/api', followRoutes);       // /api/users/:id/follow, etc.
app.use('/api', commentRoutes);      // /api/posts/:id/comments, etc.
app.use('/api', shareRoutes);        // /api/posts/:id/share, etc.
app.use('/api/feed', feedRoutes);    // /api/feed, /api/feed/trending, etc.
app.use('/admin/auth', adminAuthRoutes);
app.use('/admin/verification', adminVerificationRoutes);
app.use('/admin/users', require('./routes/adminUser.routes'));
app.use('/admin/stats', require('./routes/adminStats.routes'));

app.use('/verification', verificationRoutes);
app.use('/support', supportRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/wallet', walletRoutes);
app.use('/', moderationRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use(errorHandler);

module.exports = app;

