const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {

    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET || "jwt_secret_key",
        (err, decoded) => {

            if (err) {
                return res.status(401).json({
                    error: "Invalid token"
                });
            }

            req.user = decoded;
            next();
        }
    );
}

module.exports = requireAuth;