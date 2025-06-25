const express = require('express')
const app = express()
const UserModel = require('./models/userModel')
const PostModel = require('./models/postModel')
const cookieParser = require('cookie-parser')
const bcrypt =require('bcrypt')
const path = require('path')
const crypto =require('crypto')
// const multer = require('multer');
const jwt = require('jsonwebtoken')
const postModel = require('./models/postModel')
const upload =require('./utils/multer')
// const upload = require('./utils/multer')


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname,"public")))

app.set('view engine' ,'ejs')


app.get('/',(req,res)=>{
    res.render("index")
})

app.get('/profile/upload',(req,res)=>{
    res.render("profileupload")
})


app.post('/upload',isLoggedin,upload.single("image"), async (req,res)=>{
  let user =  await UserModel.findOne({email :req.user.email})
  user.profilepic = req.file.filename
  await user.save()
  res.redirect("/profile")
})

app.get('/login',(req,res)=>{
    res.render("login")
})




app.get('/profile',isLoggedin,async(req,res)=>{
   let user =  await UserModel.findOne({email:req.user.email}).populate('posts')

     res.render('profile',{user})
})

app.get('/like/:id',isLoggedin,async(req,res)=>{
   let post =  await postModel.findOne({_id:req.params.id}).populate('user')
   if(post.likes.indexOf(req.user.userid)===-1){
    post.likes.push(req.user.userid)
   }else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
   }
//  post.likes.push(req.user.userid)
await post.save()
     res.redirect('/profile')
})

app.get('/edit/:id',isLoggedin,async(req,res)=>{
   let post =  await postModel.findOne({_id:req.params.id}).populate('user')
  res.render('edit',{post})
})


app.post('/update/:id',isLoggedin,async(req,res)=>{
   let post =  await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
  res.redirect('/profile')
})

app.post('/post',isLoggedin,async(req,res)=>{
   let user =  await UserModel.findOne({email:req.user.email})
   let {content} = req.body
 let post =  await postModel.create({
    user:user._id,
    content
   })

   user.posts.push(post._id)
   await user.save()
   res.redirect('/profile')
})

app.post('/register',async (req,res)=>{
    let {name,username,email,password,age}=req.body
   let user =await UserModel.findOne({email})
   if(user){
        return res.status(401).send( "user already exists")
   }

   bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt ,async (err,hash)=>{
     let user= await  UserModel.create({
            username,
            name,
            email,
            password:hash,
            age
        })
       let token =  jwt.sign({email:email , userid:user._id},"shhhhh")
        res.cookie("token" ,token)
        res.redirect('/profile')
    })
   })
})

app.post('/login',async (req,res)=>{
    let {email,password}=req.body
   let user =await UserModel.findOne({email})
   if(!user){
        return res.status(401).send( "Something Wrong")
   }

   bcrypt.compare(password,user.password,(err,result)=>{
    if(result){
     
        let token =  jwt.sign({email:email , userid:user._id},"shhhhh")
        res.cookie("token" ,token)
        return   res.status(200).redirect("profile")
    }
    else{
      return  res.redirect('/login')
    }
   })
})

app.get('/logout',(req,res)=>{
    res.cookie("token","")
    res.redirect('/login')
})

function isLoggedin(req,res,next){
    if(!req.cookies.token){
        res.redirect("/login")
    }
    else{
      let data =  jwt.verify(req.cookies.token,"shhhhh")
      req.user =data
      next()
    }
    

}

app.listen(3000,()=>{
    console.log('Server Start')
})