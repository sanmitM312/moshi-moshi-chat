const asyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const User = require("../models/userModel")

const registerUser = asyncHandler(async (req,res) => {
    const { name,email,password,pic} = req.body;

    if(!name || !email || !password){
        res.status(400);
        throw new Error("Please Enter all the fields");
    }

    const userExists = await User.findOne({ email });
    if(userExists){
        res.status(400);
        throw new Error("User already exists.")
    }

    const user = await User.create({
        name,
        email,
        password,
        pic,
    });

    if(user){
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic, 
            token: generateToken(user._id),
        })
    }else{
        res.status(400);
        throw new Error("Failed to create User.")
    }
});

const authUser = asyncHandler(async (req,res) => {
    const {email,password} = req.body;

    const user = await User.findOne({ email });

    if(user && (await user.matchPassword(password))){
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic, 
            token: generateToken(user._id),
        })
    }else{
        res.status(400);
        throw new Error("Invalid email or password.")
    }
})

// using query to parse the search
// /api/user?search=Sanmit
const allUsers = asyncHandler(async(req,res) => {
    const keyword = req.query.search 
    ? {
        $or: [
            {name: { $regex: req.query.search, $options: "i"}},
            {email: { $regex: req.query.search, $options: "i"}},
        ]
    }
    : {}; // do not do anything
    // $ne means not equal to => return all users that match the current 
    // search other than the logged in user
    // find({ _id : { $ne: req.user._id }}); <= do after adding the auth middleware
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id }});
    res.send(users);
})


module.exports = {registerUser,authUser,allUsers}