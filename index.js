const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

// middleWare

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xmeadqe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const collegeCollection = client.db("CampusNexus").collection("Colleges");
    const userCollection = client.db("CampusNexus").collection("Users");
    const myCollegeCollection = client
      .db("CampusNexus")
      .collection("MyColleges");
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await userCollection.findOne(filter);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.patch("/users", async (req, res) => {
      const email = req.query.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: user?.name,
          photoURL: user?.photoURL,
          phone: user?.phone,
          gender: user?.gender,
          dob: user?.dob,
          address: user?.address,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/colleges", async (req, res) => {
      const image = req.query.image;
      const limit = req.query.limit;
      const review = req.query.review;
      const projection = {
        name: 1,
        image: 1,
        rating: 1,
        admissionDates: 1,
        researchPapers: 1,
      };
      const projectionReview = { name: 1, reviews: 1 };
      const projectionImgLimit = { name: 1, image: 1 };
      const projectionAdmission = {
        name: 1,
        image: 1,
        admissionDates: 1,
        subjects: 1,
      };
      const projectionImgNoLimit = { name: 1, image: 1, collegeGallery: 1 };
      if (image == "limit") {
        const result = await collegeCollection
          .find()
          .limit(18)
          .project(projectionImgLimit)
          .toArray();
        res.send(result);
      } else if (image == "nolimit") {
        const result = await collegeCollection
          .find()
          .project(projectionImgNoLimit)
          .toArray();
        const images = result.map((item) => {
          const { _id, name, image, collegeGallery } = item;
          return {
            _id,
            name,
            imageOne: image,
            imageTwo: collegeGallery[0],
            imageThree: collegeGallery[1],
          };
        });
        res.send(images);
      } else if (image == "admission") {
        const result = await collegeCollection
          .find()
          .project(projectionAdmission)
          .toArray();
        res.send(result);
      } else if (review) {
        const result = await collegeCollection
          .find()
          .project(projectionReview)
          .toArray();
        res.send(result);
      } else if (limit === "limit") {
        const result = await collegeCollection
          .find()
          .limit(8)
          .project(projection)
          .toArray();
        res.send(result);
      } else {
        const result = await collegeCollection
          .find()
          .project(projection)
          .toArray();
        res.send(result);
      }
    });
    app.get("/colleges/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    });

    app.get("/mycolleges", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await myCollegeCollection.find(filter).toArray();
      res.send(result);
    });
    app.post("/mycolleges", async (req, res) => {
      const college = req.body;
      const result = await myCollegeCollection.insertOne(college);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Campus Nexus!!");
});

app.listen(port, () => {
  console.log(`Campus Nexus is running on port ${port}`);
});
