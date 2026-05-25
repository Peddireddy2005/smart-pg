const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {

    try {

        let token;

        // check authorization header
        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {

            token = req.headers.authorization.split(" ")[1];

            // verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // find user
            const user = await User.findById(decoded.id);

            // attach user to request
            req.user = user;

            next();

        } else {

            return res.status(401).json({
                message: "No token provided"
            });

        }

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }

};

module.exports = protect;