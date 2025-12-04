const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { pool } = require('../config/database');
const { authenticateToken, checkSubscription } = require('../middleware/auth');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// POST /api/ai-chat/message - Send message to AI (Premium and Ultra only)
router.post('/message', authenticateToken, checkSubscription(['premium', 'ultra']), async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        const userId = req.user.id;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build messages array for OpenAI
        const messages = [
            {
                role: 'system',
                content: 'Tu es un assistant IA expert en CRM et gestion d\'entreprise. Tu aides les utilisateurs de Cloud Industrie à optimiser leur utilisation du CRM, à analyser leurs données et à prendre de meilleures décisions commerciales. Réponds toujours en français de manière professionnelle et utile.'
            },
            ...conversationHistory,
            {
                role: 'user',
                content: message
            }
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });

        const aiResponse = completion.choices[0].message.content;
        const tokensUsed = completion.usage.total_tokens;

        // Save message to database
        await pool.query(
            'INSERT INTO ai_messages (user_id, message, response, model, tokens_used) VALUES (?, ?, ?, ?, ?)',
            [userId, message, aiResponse, 'gpt-4', tokensUsed]
        );

        res.json({
            response: aiResponse,
            tokensUsed,
            model: 'gpt-4'
        });

    } catch (error) {
        console.error('AI chat error:', error);

        if (error.code === 'insufficient_quota') {
            res.status(503).json({ error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' });
        } else {
            res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA' });
        }
    }
});

// GET /api/ai-chat/history - Get chat history (Premium and Ultra only)
router.get('/history', authenticateToken, checkSubscription(['premium', 'ultra']), async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const [messages] = await pool.query(
            `SELECT id, message, response, model, tokens_used, created_at 
       FROM ai_messages 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Get total count
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM ai_messages WHERE user_id = ?',
            [userId]
        );

        res.json({
            messages,
            total: countResult[0].total,
            limit,
            offset
        });

    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

// DELETE /api/ai-chat/history - Clear chat history (Premium and Ultra only)
router.delete('/history', authenticateToken, checkSubscription(['premium', 'ultra']), async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'DELETE FROM ai_messages WHERE user_id = ?',
            [userId]
        );

        res.json({ message: 'Chat history cleared successfully' });

    } catch (error) {
        console.error('Clear chat history error:', error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

// GET /api/ai-chat/stats - Get usage statistics (Premium and Ultra only)
router.get('/stats', authenticateToken, checkSubscription(['premium', 'ultra']), async (req, res) => {
    try {
        const userId = req.user.id;

        const [stats] = await pool.query(
            `SELECT 
        COUNT(*) as totalMessages,
        SUM(tokens_used) as totalTokens,
        AVG(tokens_used) as avgTokensPerMessage,
        MIN(created_at) as firstMessage,
        MAX(created_at) as lastMessage
       FROM ai_messages 
       WHERE user_id = ?`,
            [userId]
        );

        res.json(stats[0]);

    } catch (error) {
        console.error('Get AI stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

module.exports = router;
