require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;


// artifacts
// PDpndwQI9FoeEntr

app.use(cors());
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mxvej.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database= client.db("artifactsDB");

    const artifactsCollection = database.collection("artifacts");
    const userCollection = client.db("artifactsDB").collection("users");

    app.get('/all', async(req,res)=>{
      const cursor = artifactsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

 app.post('/all', async (req, res) => {
        const newArtifact = {
          ...req.body,
        createdAt: new Date()
        }
        console.log('Adding new artifact', newArtifact)

        const result = await artifactsCollection.insertOne(newArtifact);
        res.send(result);
    });





    app.get('/users', async(req,res)=>{
  const cursor= userCollection.find();
  const result= await cursor.toArray();
  res.send(result);
})

app.get('/users/:email', async (req, res) => {
  const userEmail = req.params.email;
  const query = { email: userEmail };
  const result = await userCollection.find(query).toArray();
  res.send(result);
})

app.post('/users', async(req,res)=>{
  const newUser = req.body;
  console.log('creating new user',newUser);
  const result= await userCollection.insertOne(newUser);
  res.send(result);
})
app.patch('/users',async(req,res)=>{
  const email= req.body.email;
  const filter ={email};
  const updatedDoc = {
      $set:{
          lastSignInTime: req.body?.lastSignInTime
      }
  }
  const result= await userCollection.updateOne(filter,updatedDoc);
  res.send(result);
})
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('we see artifacts')
})

app.listen(port,()=>{
    console.log(`we see artifacts at : ${port}`)
})