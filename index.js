const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5500;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const ObjectId = require('mongodb').ObjectId;

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.olrpvxs.mongodb.net/?retryWrites=true&w=majority`;

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

        const database = client.db("tuitionMasterDB");
        const services = database.collection("services");
        const bookings = database.collection("bookings");

        app.get("/services", async (req, res) => {
            if (req.query?.email) {
                console.log(req.query);
                const query = { "serviceProvider.email": req.query.email };
                const result = await services.find(query).toArray();
                res.send(result);
            } else if (req.query?.search) {
                const searchText = req.query.search;
                const query = {
                    serviceName: { $regex: searchText, $options: "i" }
                }
                const options = {
                    sort: {
                        servicePrice: req.query.sort === "asc" ? 1 : -1
                    }
                }
                const result = await services.find(query, options).toArray();
                res.send(result);
            } else {
                const result = await services.find().toArray();
                res.send(result);
            }
        });


        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await services.findOne(query);
            res.send(result);
        })

        app.delete("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await services.deleteOne(query);
            res.send(result);
        })

        app.post("/services", async (req, res) => {
            const newService = req.body;
            const result = await services.insertOne(newService);
            console.log(result);
            res.json(result);
        })

        app.put("/services/:id", async (req, res) => {
            const filter = { _id: new ObjectId(req.params.id) };
            const options = { upsert: true };
            const updateService = req.body;
            const service = {
                $set: {
                    serviceImage: updateService.serviceImage,
                    serviceName: updateService.serviceName,
                    servicePrice: updateService.servicePrice,
                    serviceArea: updateService.serviceArea,
                    serviceDescription: updateService.serviceDescription,
                },
            };
            const result = await services.updateOne(filter, service, options);
            res.send(result);
        })


        app.get("/bookings", async (req, res) => {
            console.log(req.query);
            if (req.query?.email) {
                const query1 = { "serviceProvider.email": req.query.email };
                const userPending = await bookings.find(query1).toArray();
                const query2 = { "serviceUser.email": req.query.email };
                const userBooking = await bookings.find(query2).toArray();
                res.send({ userPending, userBooking });
            } else {
                const result = await bookings.find().toArray();
                res.send(result);
            }
        })


        app.post("/bookings", async (req, res) => {
            const newBooking = req.body;
            const result = await bookings.insertOne(newBooking);
            console.log(result);
            res.json(result);
        })

        app.put("/bookings/:id", async (req, res) => {
            const filter = { _id: new ObjectId(req.params.id) };
            // const options = { upsert: true };
            const updateState = req.body.serviceState;
            console.log(updateState);
            const booking = {
                $set: {
                    "serviceDetails.state": updateState,
                },
            };
            const result = await bookings.updateOne(filter, booking);
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


app.get('/', (req, res) => {
    res.send('Tuition Master Server is Running...')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

