const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cj8t2sd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ err: 401, message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ err: 403, message: "forbidden" });
    }
    req.decoded = decoded;
    next();
  });
};

const run = async () => {
  try {
    const servicesCollection = client.db("photography").collection("services");
    const messagesCollection = client.db("photography").collection("messages");
    const reviewCollection = client.db("photography").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    //services 3 service load
    app.get("/services", async (req, res) => {
      const id = req.query.id;
      const query = {};
      const cursor = servicesCollection.find(query);
      if (id === "2") {
        const result = await cursor.limit(2).toArray();
        return res.send(result);
      }
      if (id === "3") {
        const result = await cursor.limit(3).toArray();
        return res.send(result);
      }
      if (id === "") {
        const result = await cursor.toArray();
        res.send(result);
      }
    });

    // service insert

    app.post("/services", verifyJWT, async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

    // specific service

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    // messages

    app.post("/messages", verifyJWT, async (req, res) => {
      const message = req.body;
      const result = await messagesCollection.insertOne(message);
      res.send(result);
    });

    // all reviews

    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // reviews by service id

    app.get("/review/:serviceId", async (req, res) => {
      const id = req.params.serviceId;
      const query = { serviceId: id };
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // update modal show review

    app.get("/updatereview/:reviewId", verifyJWT, async (req, res) => {
      const id = req.params.reviewId;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    app.patch("/myreview/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const reviewMessage = req.body.review;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          reviewMessage: reviewMessage,
        },
      };
      const result = await reviewCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // decoded

    app.get("/myreview", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decoded = req.decoded.email;
      if (decoded !== email) {
        return res.status(403).send({ err: 403, message: "forbidden" });
      }
      const query = { email: email };
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // delete review

    app.delete("/myreview/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    // post review

    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
  } finally {
  }
};
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server running on port : ${port}`);
});
