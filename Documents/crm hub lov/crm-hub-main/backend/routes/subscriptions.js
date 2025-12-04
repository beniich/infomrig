const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// GET /api/subscriptions/plans - Get available subscription plans
router.get('/plans', (req, res) => {
    const plans = [
        {
            id: 'initial',
            name: 'Initial',
            price: parseFloat(process.env.PLAN_INITIAL_PRICE) || 45,
            currency: 'USD',
            interval: 'month',
            features: [
                'Accès complet au CRM',
                'Gestion des clients et produits',
                'Tableaux de bord analytiques',
                'Support par email',
                '5GB de stockage',
                'Jusqu\'à 1000 contacts'
            ]
        },
        {
            id: 'premium',
            name: 'Premium',
            price: parseFloat(process.env.PLAN_PREMIUM_PRICE) || 99,
            currency: 'USD',
            interval: 'month',
            popular: true,
            features: [
                'Tout du plan Initial',
                '🤖 Chat IA illimité (OpenAI GPT-4)',
                'Recommandations IA personnalisées',
                'Analyses prédictives',
                'Support prioritaire 24/7',
                '20GB de stockage',
                'Contacts illimités',
                'Intégrations avancées'
            ]
        },
        {
            id: 'ultra',
            name: 'Ultra',
            price: 'Sur mesure',
            currency: 'USD',
            interval: 'month',
            features: [
                'Tout du plan Premium',
                '🚀 Hébergement dédié',
                '🌐 Nom de domaine personnalisé',
                '⚙️ Accès cPanel complet',
                '💾 250GB de stockage SSD',
                '🧠 16GB RAM dédiée',
                '⚡ Processeur haute performance',
                '📡 500Mb/s de bande passante',
                'Support dédié 24/7',
                'SLA 99.9% uptime',
                'Sauvegardes quotidiennes',
                'SSL gratuit'
            ]
        }
    ];

    res.json({ plans });
});

// GET /api/subscriptions/current - Get current user subscription
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get active subscription
        const [subscriptions] = await pool.query(
            `SELECT * FROM subscriptions 
       WHERE user_id = ? AND status = 'active' 
       ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        const subscription = subscriptions[0] || null;

        // Calculate trial info
        const trialEndsAt = new Date(req.user.trial_ends_at);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

        res.json({
            subscription,
            trial: {
                isActive: req.user.subscription_plan === 'trial',
                endsAt: req.user.trial_ends_at,
                daysRemaining: Math.max(0, daysRemaining),
                expired: now > trialEndsAt
            },
            currentPlan: req.user.subscription_plan,
            status: req.user.subscription_status
        });

    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
});

// POST /api/subscriptions/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticateToken, async (req, res) => {
    try {
        const { planId, paymentProvider = 'stripe' } = req.body;
        const userId = req.user.id;

        // Validate plan
        const validPlans = {
            initial: parseFloat(process.env.PLAN_INITIAL_PRICE) || 45,
            premium: parseFloat(process.env.PLAN_PREMIUM_PRICE) || 99
        };

        if (!validPlans[planId]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        if (paymentProvider === 'stripe') {
            // Get or create Stripe customer
            let stripeCustomerId = req.user.stripe_customer_id;

            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: req.user.email,
                    metadata: {
                        userId: userId.toString()
                    }
                });
                stripeCustomerId = customer.id;

                // Update user with Stripe customer ID
                await pool.query(
                    'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
                    [stripeCustomerId, userId]
                );
            }

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                customer: stripeCustomerId,
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Abonnement ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
                            description: planId === 'premium' ? 'Inclut le chat IA illimité' : 'Accès complet au CRM'
                        },
                        unit_amount: validPlans[planId] * 100, // Convert to cents
                        recurring: {
                            interval: 'month'
                        }
                    },
                    quantity: 1
                }],
                mode: 'subscription',
                success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/subscriptions`,
                metadata: {
                    userId: userId.toString(),
                    planId
                }
            });

            res.json({
                sessionId: session.id,
                url: session.url
            });

        } else if (paymentProvider === 'paypal') {
            // TODO: Implement PayPal subscription
            res.status(501).json({ error: 'PayPal integration coming soon' });
        } else {
            res.status(400).json({ error: 'Invalid payment provider' });
        }

    } catch (error) {
        console.error('Create checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// POST /api/subscriptions/webhook - Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;

            case 'customer.subscription.updated':
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription);
                break;

            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object;
                await handleSubscriptionDeleted(deletedSubscription);
                break;

            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                await handlePaymentSucceeded(invoice);
                break;

            case 'invoice.payment_failed':
                const failedInvoice = event.data.object;
                await handlePaymentFailed(failedInvoice);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// Helper function: Handle checkout completed
async function handleCheckoutCompleted(session) {
    const userId = parseInt(session.metadata.userId);
    const planId = session.metadata.planId;
    const subscriptionId = session.subscription;

    // Update user subscription
    await pool.query(
        `UPDATE users 
     SET subscription_plan = ?, subscription_status = 'active' 
     WHERE id = ?`,
        [planId, userId]
    );

    // Create subscription record
    const price = planId === 'premium' ? 99 : 45;
    await pool.query(
        `INSERT INTO subscriptions 
     (user_id, plan_name, price, status, payment_provider, subscription_id, current_period_start, current_period_end) 
     VALUES (?, ?, ?, 'active', 'stripe', ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
        [userId, planId, price, subscriptionId]
    );

    console.log(`✅ Subscription activated for user ${userId}: ${planId}`);
}

// Helper function: Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;

    // Get user by Stripe customer ID
    const [users] = await pool.query(
        'SELECT id FROM users WHERE stripe_customer_id = ?',
        [customerId]
    );

    if (users.length > 0) {
        const userId = users[0].id;
        const status = subscription.status;

        await pool.query(
            'UPDATE users SET subscription_status = ? WHERE id = ?',
            [status, userId]
        );

        await pool.query(
            'UPDATE subscriptions SET status = ? WHERE subscription_id = ?',
            [status, subscription.id]
        );

        console.log(`✅ Subscription updated for user ${userId}: ${status}`);
    }
}

// Helper function: Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;

    const [users] = await pool.query(
        'SELECT id FROM users WHERE stripe_customer_id = ?',
        [customerId]
    );

    if (users.length > 0) {
        const userId = users[0].id;

        await pool.query(
            `UPDATE users 
       SET subscription_plan = 'trial', subscription_status = 'cancelled' 
       WHERE id = ?`,
            [userId]
        );

        await pool.query(
            'UPDATE subscriptions SET status = \'cancelled\', cancelled_at = NOW() WHERE subscription_id = ?',
            [subscription.id]
        );

        console.log(`✅ Subscription cancelled for user ${userId}`);
    }
}

// Helper function: Handle payment succeeded
async function handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    const amount = invoice.amount_paid / 100; // Convert from cents

    const [users] = await pool.query(
        'SELECT id FROM users WHERE stripe_customer_id = ?',
        [customerId]
    );

    if (users.length > 0) {
        const userId = users[0].id;

        // Record payment
        await pool.query(
            `INSERT INTO payments 
       (user_id, amount, currency, status, payment_method, payment_provider, transaction_id, invoice_id) 
       VALUES (?, ?, 'USD', 'succeeded', 'card', 'stripe', ?, ?)`,
            [userId, amount, invoice.charge, invoice.id]
        );

        console.log(`✅ Payment recorded for user ${userId}: $${amount}`);
    }
}

// Helper function: Handle payment failed
async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;

    const [users] = await pool.query(
        'SELECT id FROM users WHERE stripe_customer_id = ?',
        [customerId]
    );

    if (users.length > 0) {
        const userId = users[0].id;

        await pool.query(
            'UPDATE users SET subscription_status = \'past_due\' WHERE id = ?',
            [userId]
        );

        console.log(`⚠️ Payment failed for user ${userId}`);
    }
}

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get active subscription
        const [subscriptions] = await pool.query(
            'SELECT subscription_id FROM subscriptions WHERE user_id = ? AND status = \'active\' ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        const subscriptionId = subscriptions[0].subscription_id;

        // Cancel Stripe subscription
        if (subscriptionId) {
            await stripe.subscriptions.cancel(subscriptionId);
        }

        // Update database
        await pool.query(
            'UPDATE users SET subscription_status = \'cancelled\' WHERE id = ?',
            [userId]
        );

        await pool.query(
            'UPDATE subscriptions SET status = \'cancelled\', cancelled_at = NOW() WHERE subscription_id = ?',
            [subscriptionId]
        );

        res.json({ message: 'Subscription cancelled successfully' });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

module.exports = router;
