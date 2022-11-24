const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
var jwt = require('jsonwebtoken');
const app = express()
require("dotenv").config()

app.use(cors())
app.use(express.json())


app.get('/' , (req , res) =>{
    res.send('Doctors portal Running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b0mkc5r.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req , res ,next) =>{
  console.log('Token', req.headers.authorization)
 const authHeader = ('Token', req.headers.authorization);
 if(!authHeader){
  return res.status(401).send('unauthorized')
 }
 const token = authHeader.split(' ')[1];
 jwt.verify(token , process.env.ACCESS_TOKEN , function(err , decoded){
     if(err){
      return res.status(403).send({message : 'forbidden access'})
     }
     req.decoded = decoded;
     next()
 })


}

async function run(){
 try{
   const appointmentOptionsCollection = client.db("doctorsPortal").collection("appointmentOptions")
   const bookingsCollection = client.db("doctorsPortal").collection("bookings")
   const usersCollection = client.db("doctorsPortal").collection("users")

  
   app.get('/appointmentOptions' ,async(req , res) =>{
    const query  = {};
    const date = req.query.date;
    const options = await appointmentOptionsCollection.find(query).toArray()
    const bookingQuery = {appointmentDate: date};
    const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
    options.map(option => {
      const bookingOption = alreadyBooked.filter(book => book.treatment === option.name)
      const bookingSlot = bookingOption.map(book => book.slot) 
      const remainingSlot = option.slots.filter(slot => !bookingSlot.includes(slot))
       option.slots= remainingSlot
      console.log(option.name , remainingSlot.length)
    })
    res.send(options)
   })
   app.get('/jtw' , async(req , res) =>{
    const email = req.query.email;
    const query = {email : email}
    const user = await usersCollection.findOne(query);
    if(user){
      const token = jwt.sign({email} , process.env.ACCESS_TOKEN , {expiresIn : '1hr'})
      return res.send({accessToken : token})
    }
    res.status(403).send({accessToken : ''})
   })
   app.post('/bookings' , async(req , res) =>{
    const bookings = req.body;
    const query = {
      appointmentDate : bookings.appointmentDate,
      email : bookings.email,
      treatment:bookings.treatment
    }
    const alreadyBooked = await bookingsCollection.find(query).toArray()
    if(alreadyBooked.length){
      const message = `You have already booked on ${bookings.treatment}`
      return res.send({acknowledge : false , message})
    }
    const result = await bookingsCollection.insertOne(bookings)
    res.send(result)
   })
   app.post('/users' , async(req , res) =>{
    const bookings = req.body;
    const result = await usersCollection.insertOne(bookings)
    res.send(result)
   })
   

   app.get('/bookings' , verifyJWT ,  async(req , res) =>{
    const email = req.query.email;
    const decodedEmail = req.decoded.email;
    if(email !== decodedEmail){
      return res.status(403).send({message : 'forbidden'})
    }
    const query = {email : email};
    const result = await bookingsCollection.find(query).toArray();
    res.send(result)
   })

   app.get('/users' , async(req , res) =>{
    const query = {};
    const users = await usersCollection.find(query).toArray();
    res.send(users)
  })
  app.get('/users/admin/:email' , async(req , res) =>{
    const email = req.params.email;
    const query = {email : email}
    const user = await usersCollection.findOne(query)
    res.send({isAdmin : user?.role === 'admin'})
  })

  app.put('/users/admin/:id' , verifyJWT ,  async(req , res) =>{
    const decoded = req.decoded.email;
    const query = {email : decoded};
    const user = await usersCollection.findOne(query);
    if(user?.role !== 'admin'){
      return res.status(403).send({message : 'forbidden acces'})
    }
    const id = req.params.id;
    const filter= {_id : ObjectId(id)};
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        role: 'admin'
      },
    };
    const result = await usersCollection.updateOne(filter, updateDoc , options);
    res.send(result)
  })
  app.get('/appointmentSpecialty' , async(req , res) =>{
    const query = {};
    const result = await appointmentOptionsCollection.find(query).project({name : 1}).toArray();
    res.send(result)
  })
   
 }
 finally{

 }
}
run().catch(error => console.log(error))


app.listen(port ,() => console.log(`Doctors portal running on ${port}`))