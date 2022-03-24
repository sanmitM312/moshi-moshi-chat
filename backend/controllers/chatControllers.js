const asyncHandler = require('express-async-handler')
const Chat = require('../models/chatModel');
const User = require('../models/userModel');

// function to access the one-one chat
// clicking on a user fetches the previous chats
// of the currently logged in guy
const accessChat = asyncHandler(async(req,res) => {

    const { userId } = req.body

    if(!userId){
        console.log("UserId param not sent with request");
        return res.sendStatus(400)
    }
    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            {users: { $elemMatch : {$eq: req.user._id }}},
            {users: { $elemMatch : {$eq: userId }}},
        ]
    }).populate("users","-password").populate("latestMessage");
        // for populating the latest message sender we have to do this
        isChat = await User.populate(isChat,{
            path: "latestMessage.sender",
            select: "name pic email",
        })
    
    // if chat exists
    if(isChat.length > 0){
        res.send(isChat[0]); // single valued array
    }else{
        // create a chat
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id,userId],
        };

        try{
            const createdChat = await Chat.create(chatData);
            // take the newly created chat and send it to the user
            const FullChat = await Chat.findOne({_id: createdChat._id}).populate(
                "users",
                "-password",
            )
                
            res.status(200).send(FullChat);
        }catch(error){
            res.status(400);
            throw new Error(error.message);
        }

        
    }
})

const fetchChats = asyncHandler(async(req,res)=>{
    try{
        // return all the chats that the logged user is part of
        Chat.find({ users: { $elemMatch: {$eq: req.user._id }}})
            .populate("users","-password")
            .populate("groupAdmin","-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1})
            .then(async (results) => {
                results = await User.populate(results,{
                    path: "latestMessage.sender",
                    select: "name pic email",
                });
                res.status(200).send(results);
            })
    }catch(err){
        res.status(400);
        throw new Error(error.Message);
    }
})

// takes an array of users and name of the group as input
const createGroupChat = asyncHandler(async(req,res) => {
    if(!req.body.users || !req.body.name){
        return res.status(400).send({ message: "Please Fill all the fields"});
    }

    // req data is passes in strigify format from the frontend
    // need to parse that
    var users = JSON.parse(req.body.users);
    if(users.length < 2){
        return res
            .status(400)
            .send("More than 2 users are required to form a group chat");
    }
    // also the current user
    users.push(req.user);
    try{
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });
        
        // fetch the chat from the database and send 
        // back to the user
        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users","-password")
            .populate("groupAdmin","-password");

            res.status(200).json(fullGroupChat);
    }catch(err){
        res.status(400);
        throw new Error(error.message);
    }
})

const renameGroup = asyncHandler(async(req,res) => {
    const { chatId, chatName } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName,
        },{
            new: true
        }
    )
        .populate("users","-password")
        .populate("groupAdmin","-password");
    
    if(!updatedChat){
        res.status(404);
        throw new Error("Chat Not Found");
    }else{
        res.json(updatedChat);
    }
})


const addToGroup = asyncHandler(async(req,res) => {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: {users: userId},
        },
        { new: true}
    ).populate("users","-password")
    .populate("groupAdmin","-password");

    if(!added){
        res.status(404);
        throw new Error("Chat Not Found");
    }else{
        res.json(added);
    }
})


const removeFromGroup = asyncHandler(async(req,res) => {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: {users: userId},
        },
        { new: true}
    ).populate("users","-password")
    .populate("groupAdmin","-password");

    if(!removed){
        res.status(404);
        throw new Error("Chat Not Found");
    }else{
        res.json(removed);
    }
})
module.exports = {accessChat,fetchChats,createGroupChat,renameGroup,addToGroup,removeFromGroup}