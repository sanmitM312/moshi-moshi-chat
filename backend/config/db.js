const mongoose = require('mongoose');

const connectDB = async() => {
    try{
        // console.log(process.env.MONGO_URI)
        const conn = await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    }catch(error){
        console.log(`Error: ${error.message}`.red.bold)
        process.exit();
    }
};
module.exports = connectDB;