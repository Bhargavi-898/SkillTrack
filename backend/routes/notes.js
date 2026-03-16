const express=require("express");
const router=express.Router();
const multer=require("multer");
const path=require("path");
const Note=require("../models/Note");
const verifyToken=require("../middlewares/auth");

const storage=multer.diskStorage({

destination:function(req,file,cb){
cb(null,"uploads/notes");
},

filename:function(req,file,cb){
cb(null,Date.now()+"-"+file.originalname);
}

});

const upload=multer({storage});


// Upload Note
router.post("/upload",verifyToken,upload.single("file"),async(req,res)=>{

try{

const note=new Note({

title:req.body.title,
description:req.body.description,

fileUrl:`uploads/notes/${req.file.filename}`,

fileType:req.file.mimetype,

uploadedBy:req.user.userId

});

await note.save();

res.json({
message:"Note uploaded successfully"
});

}
catch(err){

console.log(err);

res.status(500).json({
message:"Upload failed"
});

}

});


// Get all notes
router.get("/",async(req,res)=>{

const notes=await Note.find()
.populate("uploadedBy","name profilePhoto")
.sort({createdAt:-1});

res.json(notes);

});

module.exports=router;