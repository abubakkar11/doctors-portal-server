const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()
require("dotenv").config()

app.use(cors())
app.use(express.json())

app.get('/' , (req , res) =>{
    res.send('Doctors portal Running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b0mkc5r.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
 try{
   const appointmentOptionsCollection = client.db("doctorsPortal").collection("appointmentOptions")
   app.get('/appointmentOptions' ,async(req , res) =>{
    const query  = {};
    const result = await appointmentOptionsCollection.find(query).toArray()
    res.send(result)
   })
 }
 finally{

 }
}
run().catch(error => console.log(error))


app.listen(port ,() => console.log(`Doctors portal running on ${port}`))