var express  = require('express');
var app      = express();
var port     = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var app_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var bodyParser   = require('body-parser');
var cors = require('cors');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var wellknown = require('nodemailer-wellknown');
var envVars = require('./env');
var morgan = require('morgan');

var whitelist = ['http://example1.com', 'http://example2.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
  }
};
app.options('*', cors()); 
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // get information from html forms
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.post('/email', cors(), function(req, res) {
  var {sendTo, subject, text} = req.body;
  if (!sendTo || !subject || !text){
    var emessage = 'You\'re missing something';
    if (!sendTo){
      emessage+= 'You need a recieving address.'
    }
    if (!subject)
    return res.status(400).json({message:`You're missing somet`})
  }
  var smtpTransport = nodemailer.createTransport({
      service: envVars.email.service,
      auth: {
              user: envVars.email.user,
              pass: envVars.email.pass
          }
  }),
  mailOptions = {
      to: sendTo,
      from: envVars.email.user,
      subject: subject,
      text: text
  };
  smtpTransport.sendMail(mailOptions, function (err) {
    if (err){
      return res.status(404).json({message:'error: \n'+ err})

    }
    return res.status(200).json({message:'The email was sent!'})
  });
});

app.listen(port,app_ip_address);
console.log('The magic happens on port ' + port);

module.exports  = app;
