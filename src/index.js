const express = require("express")
const route = require('./router/route')
const mongoose = require('mongoose')
const multer = require('multer')

const app = express();

app.use(express.json())
app.use(multer().any())

mongoose.set('strictQuery', true)
mongoose.connect("mongodb+srv://PriyankaChavan:priyanka@cluster0.iocf9uz.mongodb.net/shoppingCart",
{useNewUrlParser:true})

.then(()=>console.log("mongodb connected"))
.catch(err => console.log(err))

app.use('/',route)

app.use((req,res)=>{
    res.status(404).send({status:false,msg:"request not found"})
})

app.listen(process.env.PORT || 3000,function(){
    console.log('express app running on port '+ (process.env.PORT || 3000))
})

