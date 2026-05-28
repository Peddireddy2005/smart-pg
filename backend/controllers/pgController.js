const PG = require("../models/PG");

const createPG = async (req, res) => {

    try {
        const {
            name,
            address,
            description,
            amenities,
            rentRange
        } = req.body;
        const pg = await PG.create({
            name,
            address,
            description,
            amenities,
            rentRange,
            // VERY IMPORTANT
            owner: req.user._id
        });
        res.status(201).json({
            message: "PG Created Successfully",
            pg
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getAllPGs = async (req, res) => {
    try {
        const pgs = await PG.find().populate(
            "owner",
            "name email"
        );
        res.status(200).json(pgs);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }

};

const getSinglePG = async (req, res) => {
    try {
        const pg = await PG.findById(req.params.id)
            .populate("owner", "name email");
        if (!pg) {
            return res.status(404).json({
                message: "PG Not Found"
            });
        }
        res.status(200).json(pg);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }

};

const getMyPGs = async(req,res) =>{
    try{
        console.log("GET MY PGS HIT");
        const pgs = await PG.find({owner:req.user._id,});
        res.status(200).json(pgs);
    }catch(error){
        res.status(500).json({
            message:error.message,
        
        });
    }
}

module.exports = {
    createPG,
    getAllPGs,
    getSinglePG,
    getMyPGs
};