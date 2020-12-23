const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Role = require('../models/role');
const Study = require('../models/study');
const Token = require('../models/token');
const Challenge = require('../models/challenge');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const crypto = require('crypto');

const neuronegmService = require('../services/neuronegm/connect');
const playerService = require('../services/neuronegm/player');

const authMiddleware = require('../middlewares/authMiddleware');
const { isValidObjectId } = require('mongoose');

router.post('/register', [authMiddleware.verifyBodyAdmin, authMiddleware.uniqueEmail], async (req, res) => {
    // Role
    const role = await Role.findOne({name: 'admin'}, err => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }
    });
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(req.body.password, salt);
    //create user
    const user = new User({
        email: req.body.email,
        password: hashpassword,
        role: role._id
    })
    await neuronegmService.connectGM(req.body.email, req.body.password, err => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }
    })
    //save user in db
    await user.save((err, user) => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }
        res.status(200).json({
            user
        });
    })
})

router.post('/register/:study_id', [authMiddleware.verifyBody, authMiddleware.uniqueEmail], async (req, res)=>{

    const study_id = req.params.study_id;
    if(!isValidObjectId(study_id)){
        return res.status(404).json({
            ok: false,
            message: "Study doesn't exist!"
        });
    }
    const role = await Role.findOne({name: 'student'}, err => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }
    });
    const study = await Study.findOne({_id: study_id}, err => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }
    })
    if(!study){
        return res.status(404).json({
            ok: false,
            message: "STUDY_NOT_FOUND_ERROR"
        });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(req.body.password, salt);
    const challenges = await Challenge.find({study: study}, err => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }
    })
    //create user
    const user = new User({
        email: req.body.email,
        tutor_names: req.body.tutor_names,
        tutor_last_names: req.body.tutor_last_names,
        tutor_rut: req.body.tutor_rut,
        tutor_phone: req.body.tutor_phone,
        names: req.body.names,
        last_names: req.body.last_names,
        birthday: req.body.birthday,
        course: req.body.course,
        institution: req.body.institution,
        institution_commune: req.body.institution_commune,
        institution_region: req.body.institution_region,
        password: hashpassword,
        role: role._id,
        study: study._id,
        challenges_progress: generateProgressArray(challenges)
    });

    //save user in db
    user.save((err, user) => {
        if(err){
            return res.status(404).json({
                ok: false,
                err
            });
        }

        // Send confirmation email
        sendConfirmationEmail(user, res, req);

        // Register player in NEURONE-GM
        saveGMPlayer(req, user, res);

        res.status(200).json({
            user
        });
    });
});

function saveGMPlayer(req, user, res) {
    playerService.postPlayer({ name: req.body.names, last_name: req.body.last_names, sourceId: user._id }, (err, data) => {
        if (err) {
            console.log(err);
            res.status(200).json({
                user
            });
        }
        else {
            user.gm_code = data.code;
            user.save(err => {
                if (err) {
                    return res.status(404).json({
                        ok: false,
                        err
                    });
                }
            });
        }
    });
}

function sendConfirmationEmail(user, res, req) {
    // Create a verification token
    const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

    // Save the verification token
    token.save((err) => {
        if (err) { return res.status(500).send({ msg: 'TOKEN_ERROR' }); }

        // Send the email
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SENDEMAIL_USER, pass: process.env.SENDEMAIL_PASSWORD } });
        const mailOptions = { from: 'neuronemail2020@gmail.com', to: user.email, subject: 'Verifique su correo', text: 'Hola,\n\n' + 'por favor, verifique su correo ingresando al siguiente link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
        transporter.sendMail(mailOptions, (err) => {
            if (err) { return res.status(500).send({ msg: err.message }); }
        });
    });
}

function generateChallengeSequence(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function generateProgressArray(challenges) {
    const sequence = generateChallengeSequence(challenges);
    let progress = [];
    sequence.forEach(challenge => {
        progress.push({
            challenge: challenge
        });
    });
    return progress;
}



module.exports = router;