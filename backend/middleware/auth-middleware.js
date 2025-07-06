const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // Just verify the token is valid (no role check)
        req.userInfo = decodedToken;
        next();
    } catch (e) {
        console.error('Auth middleware error:', e);
        
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;