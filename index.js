require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;


// artifacts
// PDpndwQI9FoeEntr

// app.use(cors({
//   origin:[
//     'http://localhost:5173',
//   ],
//   credentials:true
// }));
// app.use(cors());
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mxvej.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    
    await client.connect();
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database= client.db("artifactsDB");




app.post('/jwt', async (req, res) => {
  const {email} = req.body; 
   if (!email) {
    return res.status(400).send({ error: 'Email is required' });
  }

  const token = jwt.sign({email}, process.env.JWT_SECRET, { expiresIn: '2h' });

  res
    .cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    })
    .send({ success: true });
});
app.post('/logout', (req, res) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    })
    .send({ success: true });
});
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.user = decoded;
    next();
  });
};


    const artifactsCollection = database.collection("artifacts");
    const userCollection = client.db("artifactsDB").collection("users");

    // app.get('/all', async(req,res)=>{
    //   const cursor = artifactsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // })

    app.get('/all', async (req, res) => {
  const search = req.query.search;

  let query = {};
  if (search) {
    query = { name: { $regex: search, $options: 'i' } }; 
  }

  try {
    const cursor = artifactsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).send({ message: 'Server Error' });
  }
});

//  app.get('/all/user',verifyToken, async (req, res) => {
//       const userEmail = req.query.email;
//       if (!userEmail) return res.status(400).json({ error: "Email required" });
//     //   if (req.user.email !== userEmail) {
//     // return res.status(403).send({ message: "Forbidden access" });
//   // }

//       const result = await artifactsCollection.find({ userEmail }).toArray();
//       res.send(result);
//     });

app.get('/all/user', verifyToken, async (req, res) => {
  const userEmail = req.query.email;
  const decodedEmail = req.user?.email;

  if (userEmail !== decodedEmail) {
    return res.status(403).send({ message: "Forbidden access" });
  }

  const result = await artifactsCollection.find({ userEmail }).toArray();
  res.send(result);
});


 app.post('/all',verifyToken, async (req, res) => {
  const newArtifact = {
    ...req.body,
   artifactsCreatedAt: req.body.artifactsCreatedAt,
    createdAt: new Date(),
    likeCount: 0  ,
    likedBy: []
  };

  console.log('Adding new artifact', newArtifact);

  const result = await artifactsCollection.insertOne(newArtifact);
  res.send(result);
});

app.get('/all/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await artifactsCollection.findOne(query);
  res.send(result);
})
app.put('/all/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      name: updatedData.name,
      image: updatedData.image,
      type: updatedData.type,
      historicalContext: updatedData.historicalContext,
      createdAt: updatedData.createdAt,
      artifactsCreatedAt: updatedData.artifactsCreatedAt,
      discoveredAt: updatedData.discoveredAt,
      discoveredBy: updatedData.discoveredBy,
      presentLocation: updatedData.presentLocation
    }
  };

  const result = await artifactsCollection.updateOne(filter, updateDoc);
  res.send(result);
});

 app.delete('/artifact/:id', async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid artifact ID' });
      }

      try {
        const result = await artifactsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Artifact not found' });
        }

        res.json({ deletedCount: result.deletedCount });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete artifact' });
      }
    });

// app.patch('/artifact/like/:id', async (req, res) => {
//   const artifactId = req.params.id;  
//   const query = { _id: new ObjectId(artifactId) };

//   try {
    
//     const updateDoc = {
//       $inc: { likeCount: 1 }
//     };

//     const result = await artifactsCollection.updateOne(query, updateDoc);

//     if (result.modifiedCount > 0) {
//       res.status(200).json({ message: 'Like count updated successfully' });
//     } else {
//       res.status(400).json({ message: 'Failed to update like count' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

 app.patch('/artifact/like/:id', async (req, res) => {
      const artifactId = req.params.id;
      const artifact = await artifactsCollection.findOne({ _id: new ObjectId(artifactId) });

      if (!artifact) return res.status(404).json({ message: 'Artifact not found' });

      const userEmail = req.body.email;
      let updatedArtifact;

      if (artifact.likedBy.includes(userEmail)) {
        // Unlike
        updatedArtifact = await artifactsCollection.findOneAndUpdate(
          { _id: new ObjectId(artifactId) },
          { $pull: { likedBy: userEmail }, $inc: { likeCount: -1 } },
          { returnDocument: 'after' }
        );
      } else {
        // Like
        updatedArtifact = await artifactsCollection.findOneAndUpdate(
          { _id: new ObjectId(artifactId) },
          { $addToSet: { likedBy: userEmail }, $inc: { likeCount: 1 } },
          { returnDocument: 'after' }
        );
      }

      res.json(updatedArtifact.value);
    });



 

app.patch('/users/like', async (req, res) => {
  const { email, artifactId } = req.body;
  const result = await userCollection.updateOne(
    { email },
    { $addToSet: { likedArtifacts: artifactId } }
  );
  res.send(result);
});

app.get('/users/liked/:email', async (req, res) => {
  const email = req.params.email;
  const user = await userCollection.findOne({ email });
   console.log('Fetched user:', user);

  if (!user?.likedArtifacts?.length) return res.send([]);

  const query = { _id: { $in: user.likedArtifacts.map(id => new ObjectId(id)) } };
  const likedArtifacts = await artifactsCollection.find(query).toArray();
  res.send(likedArtifacts);
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
  // const newUser = req.body;
  const newUser = {
    ...req.body,
    likedArtifacts: [], 
  };
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