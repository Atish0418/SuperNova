require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/db/db');

connectDB();
    
app.listen('/', ()=>{
    console.log("server is running on port 3000!")
})