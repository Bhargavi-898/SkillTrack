const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

description:String,

fileUrl:String,

fileType:String,

uploadedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Note",noteSchema);