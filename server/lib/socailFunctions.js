const passport = require('passport');
let GoogleStrategy = require('passport-google-oauth20').Strategy;
let FacebookStrategy = require('passport-facebook').Strategy;
const mongoose = require('mongoose');
let userFunctions = require('../lib/userFunctions');
const jwt = require('jsonwebtoken');

let User = require('../models/user');

passport.serializeUser((user, done) => {
    user = JSON.stringify(user);
    done(null, user);
});

passport.deserializeUser((user, done) => {
    user = JSON.parse(user);
    done(null, user);
});

let fillModel = (user, profile) => {
    return new Promise((resolve, reject) => {
        user = new User({
            companyId: null,
            createdAt: new Date().toDateString(),
            email: profile.emails[0].value,
            emailVerified: true,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            fullName: profile.name.givenName + ' ' + profile.name.familyName,
            hasSeenVideo: false,
            lastLoginAt: new Date().toDateString(),
            photoUri: profile.photos[0].value,
            provider: profile.provider,
            providerId: profile.id
        });
        resolve(user);
    });
    
}

let authStrategy = (profile, done) => {
    User.findOne({
        'providerId': profile.id
    }, async (err, user) => {
        if(err) {
            return done(err);
        }
        if(!user) {
            try {
                user = await fillModel(user, profile);
                console.log(user);
                await User.init();
                await userFunctions.saveUser(user);
                done(err, user);
            } catch (err) {
                done(err);
            }
        } else {
            console.log('User has been found');
            return done(err, user);
        }
    });
}

//google auth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK
},
    (token, tokenSecret, profile, done) => {
        authStrategy(profile, done);
    }
));

//facebook auth
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENTID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK,
    profileFields: ['id', 'emails', 'name', 'photos']
},
    (accessToken, refreshToken, profile, done) => {
        authStrategy(profile, done);
    }
));