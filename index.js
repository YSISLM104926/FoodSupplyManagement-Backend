const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('Sysco');
        const suppliesCollection = db.collection('supplies');
        const usersCollection = db.collection('users');
        const donorCollection = db.collection('donorsleaderboard');
        const testimonialCollection = db.collection('testimonial');
        const commentsCollection = db.collection('comments');
        const volunteerCollection = db.collection('volunteer');
        // User Registration
        app.post('/api/auth/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await usersCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await usersCollection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/auth/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        // ==============================================================
        // WRITE YOUR CODE HERE
        app.get('/supplies', async (req, res) => {
            const search = {};
            const result = await suppliesCollection.find(search).toArray();
            res.send(result);
        })
        app.post('/supplies', async (req, res) => {
            const query = req.body;
            const result = await suppliesCollection.insertOne(query);
            res.send(result);
        })


        app.post('/testimonial', async (req, res) => {
            const query = req.body;
            const result = await testimonialCollection.insertOne(query);
            res.send(result);
        })

        app.post('/community-comments', async (req, res) => {
            const query = req.body;
            const result = await commentsCollection.insertOne(query);
            res.send(result);
        })


        app.post('/volunteer', async (req, res) => {
            const query = req.body;
            const result = await volunteerCollection .insertOne(query);
            res.send(result);
        })

        app.get('/leaderboard', async (req, res) => {
            const search = {};
            const result = await donorCollection.find(search).sort({ total_donation: -1 }).toArray();
            console.log(result);
            res.send(result);
        })

        app.delete('/supplies/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await suppliesCollection.deleteOne(query);
            res.send(result);
        });
        // ==============================================================

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});