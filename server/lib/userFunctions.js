let User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//hashing password
let getHashPass = (cleanPass) => {
    let encryptedPass = bcrypt.hash(cleanPass, 10);
    return encryptedPass;
}

//hash for sending it in email verification message
let getVerificationHash = () => {
    let result = '';
    let symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for(let i = 0; i < 20; i++){
        result += symbols.charAt(Math.random() * symbols.length);
    }
    return result;
}

//create token for authorization
let createToken = (user) => {
    return new Promise((resolve, reject) => {
        let token;
        User.findById(user.id, (err, result) => {
            if(err) {
                reject(err);
            }
            let expiry = new Date();
            expiry.setDate(expiry.getDate() + 7);
            token = jwt.sign({
                _id: result.id,
                email: result.email,
                exp: parseInt(expiry.getTime() / 1000),
            },
            'MY_SECRET');
            resolve(token);
        });
    });
}

let saveUser = (user) => {
    return new Promise((resolve, reject) => {
        user.save((err, result) => {
            resolve(console.log('saved: ', result));
        });
    });
}

let login = (req, res, result, next) => {
    bcrypt.compare(req.body.password, result.passwordHash, async (err, success) => {
        if(err) {
            console.error(err);
            res.status(500).json(err);
            return next();
        }
        if(success) {
            console.log('passwords match');
            let token;
            try {
                token = await createToken(result, res, next);
                console.log('token: ', token);
                return next();
            } catch (e) {
                console.error(e);
                res.status(500).json(err);
                return next();
            }
            res.status(200).json({
                'token': token
            });
            return next();
        } else {
            console.log('passwords don`t match');
            res.status(200).json({msg: 'passwords don`t match'});
            return next();
        }
    });
}

module.exports = {
    getHashPass: getHashPass,
    login: login,
    saveUser: saveUser,
    createToken: createToken,
    getVerificationHash: getVerificationHash
}