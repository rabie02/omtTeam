const jwt = require('jsonwebtoken');
const Account = require('../../models/account');
require('dotenv').config();

const verifyAccountToken = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ 
            success: false,
            message: 'Token is required', 
            reason: 'missing' 
        });
    }

    // Verify token structure first
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid token format', 
            reason: 'invalid' 
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token has the required id field
        if (!decoded.id) {
            return res.status(400).json({ 
                success: false,
                message: 'Token is missing required information', 
                reason: 'invalid' 
            });
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired', 
                reason: 'expired' 
            });
        }
        return res.status(400).json({ 
            success: false,
            message: 'Invalid token', 
            reason: 'invalid' 
        });
    }

    // Verify the account exists in MongoDB
    try {
        const account = await Account.findOne({ sys_id: decoded.id });
        
        if (!account) {
            return res.status(404).json({ 
                success: false,
                message: 'Account not found', 
                reason: 'notfound' 
            });
        }

        if (account.archived) {
            return res.status(403).json({ 
                success: false,
                message: 'Account is archived', 
                reason: 'archived' 
            });
        }

        return res.status(200).json({
            success: true,
            accountId: account._id,
            email: account.email,
            name: account.name,
            sys_id: account.sys_id
        });

    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            reason: 'server_error'
        });
    }
};

module.exports = verifyAccountToken;