const express = require('express');
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());

const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = process.env.MONGO_DB_URI;

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

    const database = client.db('fable');
    const booksCollection = database.collection('books');
    const bookmarkCollection = database.collection('bookmark');
    const paymentCollection = database.collection('payment');
    const usersCollection = database.collection('user');

    // books api..........................

    app.get('/books', async (req, res) => {
      const query = {};

      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.post('/books', async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })

    app.patch('/books/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: req.body };

      const result = await booksCollection.findOneAndUpdate(filter, updateDoc, { returnDocument: 'after' });
    })

    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const result = await booksCollection.deleteOne(filter);
      res.send(result);
    })

    //sob books er jonno..............
    app.get('/books', async (req, res) => {
      const result =await booksCollection.find().toArray();
      res.send(result);
    })

    //details book er jonno........

    app.get('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;


        const { ObjectId } = require('mongodb');
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: true, message: "Invalid MongoDB ID format" });
        }

        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ error: true, message: "Book not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error caught:", error.message);
        res.status(500).send({ error: true, message: error.message });
      }
    });

    //bookmark api..................

    app.post('/bookmark', async (req, res) => {
      const book = req.body;
      const result = await bookmarkCollection.insertOne(book);
      res.send(result);
    })


    app.get('/bookmark', async (req, res) => {

      const email = req.query.email;

      const query = { userEmail: email };
      const result = await bookmarkCollection.find(query).toArray();
      res.send(result);
    });

    // payment api...................

    app.post('/payments', async (req, res) => {
      const { sessionId } = req.body;

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const payment = {
        sessionId,
        ...session.metadata,
        amount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        createdAt: new Date()
      };

      const result = await paymentCollection.insertOne(payment);

      res.send(result);
    });
    
    
    app.get('/payments', async (req, res) => {
      const result =await paymentCollection.find().toArray();
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})