const nodemailer = require("nodemailer");
const userCredentials = require('../credentials/mailCredentials');

const transporter = nodemailer.createTransport({
    /*host: 'smtp.gmail.com',
    port: 465,
    secure: true,*/
    service: 'gmail',
    auth: {
        user: userCredentials.user,
        pass: userCredentials.password
    }
});

let mailOptions = {
    from: '"vivenhealth" <' + `${userCredentials.user}` + '>',
    subject: 'verification'
};

let sendVerification = (hash, email, res, next) => {
    mailOptions.to = email;
    mailOptions.html = '<p> Click <a href="http://localhost:3000/confirm/' + hash + '"> here </a> to verify your email adress';
    transporter.sendMail(mailOptions, (err, info) => {
        if(err) {
            console.error('error while sending message');
            console.error(err);
            res.status(500).json(err);
            return next();
        }
        console.log(info);
    });
}

module.exports = {
    sendVerification: sendVerification
}