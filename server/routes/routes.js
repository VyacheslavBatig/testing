const express = require('express');
const router = express.Router(); 
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

router.use(bodyParser.urlencoded({
    extended: true
}));
require('dotenv').config();
let emailFunctions = require('../lib/emailFunctions');
let userFunctions =  require('../lib/userFunctions');
require('../lib/socailFunctions');
let User = require('../models/user');

router.use(passport.initialize());

mongoose.connect('mongodb://localhost/users', {useNewUrlParser: true});

/**
 * common registration (from form) route
 * creates new instance of User and saves it to DB
 * with checking if email already exists in DB (init())
 */
router.post('/registration', async (req, res, next) => {
    let user = new User(req.body);
    user.fullName = user.firstName + ' ' + user.lastName;
    user.emailVerified = user.hasSeenVideo = false;
    user.createdAt = user.lastLoginAt = user.photoUri = null;

    try {
        await User.init();
        user.emailHash = await userFunctions.getVerificationHash();
        user.passwordHash = await userFunctions.getHashPass(req.body.password);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
        return next();
    }
    userFunctions.saveUser(user);
    emailFunctions.sendVerification(user.emailHash, user.email, res, next);
});

/**
 * email confirmation route
 * finds user in DB by unique emailHash and changed emailVerified flag
 * then deletes emailHash because we don't need it anymore
 * Then user is automatically authorized
 */
router.get('/confirm/:hash', (req, res, next) => {
    User.findOne( { emailHash: `${req.params.hash}`}, 
        async (err, result) => {
            if(err) {
                console.error(err);
                res.status(500).json(err);
            }
            result.emailVerified = true;
            result.emailHash = undefined;
            let token;
            try {
                await userFunctions.saveUser(result);
                console.log('changed to: ', result);
                token = await userFunctions.createToken(result, res, next);
            } catch(err) {
                console.error(err);
                res.status(500).json(err);
            }
            res.status(200).json({
                'token': token
            });
        });
});

/**
 * gets user from db, check if password in body.password matches hashPassowrd
 * from db with the help of bcrypt.compare and the returns token
 */
router.post('/login', (req, res, next) => {
    User.findOne({ email: `${req.body.email}`}, 
        (err, result) => {
            if(err) {
                console.error(err);
                res.status(500).json(err);
            }
            userFunctions.login(req, res, result, next);
        }
    );
});

router.get('/login/google', 
    passport.authenticate('google', { scope: 
        [
        'email',
        'profile'
        ]
}));

router.get('/login/facebook',
    passport.authenticate('facebook', { scope: 
        [
            'public_profile',
            'email'
        ]
}));

/**
 * common fb authorization with creating of jwt token
 */
router.get('/logged/facebook',
    passport.authenticate('facebook', {failureRedirect: '/login'}),
    async (req, res, next) => {
        console.log('fb works');
        let token;
        try {
            token = await userFunctions.createToken(req.user);
        } catch (err) {
            console.error(err);
            res.status(500).json(err);
        }
        res.status(200).json({'token': token});
    });

    /**
     * common google authorization with creating of jwt token
     */
router.get('/logged/google',
    passport.authenticate('google', { failureRedirect: '/login', }),
    async (req, res, next) => {
        console.log('google works');
        let token;
        try {
            token = await userFunctions.createToken(req.user);
        } catch (err) {
            console.error(err);
            res.status(500).json(err);
        }
        res.status(200).json({'token': token});
});

router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

module.exports = router;