require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env['MONGODB_URL']);

const app = express();

app.use(express.json());

app.post('/register', async function(req, res) {
    if (!req.body.username) {
        res.status(400).send({message: "No username found"});
        return;
    }

    const db = client.db('AudioToText');
    const collection = db.collection('users');

    try {
        await collection.insertOne({
            username: req.body.username
        });
    } catch(error) {
        res.status(409).send(error);
    }

    res.send();
});

async function main() {
    await client.connect();
    app.listen(parseInt(process.env['PORT']), () => {
        console.log("server started");
    });
}

main();