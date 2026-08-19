require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { PORT } = require('./config/constants');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.use('/api', routes);

app.listen(PORT, () => console.log(`🚀 Node Backend running on port ${PORT}`));
