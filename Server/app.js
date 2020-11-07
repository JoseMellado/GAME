/** External modules **/
const express = require('express');
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require('config'); //we load the db location from the JSON files
const morgan = require('morgan');
const bcrypt = require('bcryptjs');

const Role = require('./models/role');
const User = require('./models/user');

/** Internal modules **/
require('./config/config');
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenge');
const userRoutes = require('./routes/user');
const studyRoutes = require('./routes/study');
const documentRoutes = require('./routes/document');
const questionnaireRoutes = require('./routes/questionnaire');
const sendEmailRoutes = require('./routes/send-email');


//db connection
mongoose.connect(config.DBHost, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(()=>{
        console.log("Successfully connect to MongoDB.");
        initial();
    });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

async function initial() {
     Role.estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
            new Role({
                name: "admin"
            }).save(err => {
                if (err) {
                    console.log("error", err);
                }

                console.log("added 'admin' to roles collection");
            });
            
            new Role({
                name: "student"
            }).save(err => {
                if (err) {
                    console.log("error", err);
                }

                console.log("added 'student' to roles collection");
            });
        }
    });

    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash("admin", salt);

    User.estimatedDocumentCount((err, count)=> {
        if(!err && count == 0){
            Role.findOne({name: 'admin'}, (err, role) => {
                if(err){
                    return res.status(404).json({
                        ok: false,
                        err
                    });
                }
                new User({
                    email: "admin@admin.com",
                    password: hashpassword,
                    birthday: Date.now(),
                    role: role._id
                }).save((err, user) =>{
                    if(err){
                        console.log("error", err);
                    }
                    console.log("added admin to users collection")
                })
            });
        }
    })
}

/** Express setup **/
const app = express();
app.use(cors())

//don't show the log when it is test
if(config.util.getEnv('NODE_ENV') !== 'test') {
    //use morgan to log at command line
    app.use(morgan('combined')); //'combined' outputs the Apache style LOGs
}

//parse application/json and look for raw text
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: 'application/json'}));

/** Express routing **/
app.use('/api/auth', authRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/send-email', sendEmailRoutes);

app.get('/', function (req, res) {
    res.send('Hello World!');
});


/** Server deployment **/
app.listen(process.env.PORT, () => {
    console.log(`Server listening on the port::${process.env.PORT}`);
});

/** Export APP for testing **/
module.exports = app;