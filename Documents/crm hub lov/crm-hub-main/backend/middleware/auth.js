const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

            // Get user from database
            const [users] = await pool.query(
                'SELECT id, email, full_name, subscription_plan, subscription_status, trial_ends_at FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            req.user = users[0];
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Middleware to check subscription status
const checkSubscription = (allowedPlans = []) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            // Check if trial has expired
            if (user.subscription_plan === 'trial') {
                const trialEndsAt = new Date(user.trial_ends_at);
                const now = new Date();

                if (now > trialEndsAt) {
                    return res.status(403).json({
                        error: 'Trial period expired',
                        message: 'Please upgrade to a paid plan to continue using this feature',
                        trialExpired: true
                    });
                }
            }

            // Check if subscription is active
            if (user.subscription_status !== 'active') {
                return res.status(403).json({
                    error: 'Subscription inactive',
                    message: 'Your subscription is not active. Please update your payment method.',
                    subscriptionStatus: user.subscription_status
                });
            }

            // Check if user's plan is allowed
            if (allowedPlans.length > 0 && !allowedPlans.includes(user.subscription_plan)) {
                return res.status(403).json({
                    error: 'Insufficient subscription plan',
                    message: `This feature requires one of the following plans: ${allowedPlans.join(', ')}`,
                    currentPlan: user.subscription_plan,
                    requiredPlans: allowedPlans
                });
            }

            next();
        } catch (error) {
            console.error('Subscription check error:', error);
            res.status(500).json({ error: 'Subscription verification failed' });
        }
    };
};

module.exports = { authenticateToken, checkSubscription };
