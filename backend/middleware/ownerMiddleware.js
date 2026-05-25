const ownerOnly = (req,res,next) => {
    if(req.user.role !== "owner"){
        return res.status(403).json({
            message: "Access denied"
        });
    }
    next();
};

module.exports = ownerOnly;