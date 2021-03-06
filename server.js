var express  = require('express');
var app      = express();
var port     = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8081;
var app_ip_address = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var bodyParser   = require('body-parser');
var cors = require('cors');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var wellknown = require('nodemailer-wellknown');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var request = require('request');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

var whitelist = ['http://example1.com', 'http://example2.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
  }
};
var smtpTransport = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
});
app.use(express.static(public));
app.options('*', cors());
app.use(morgan('combined',{stream:accessLogStream})); // log every request to the console
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // get information from html forms

app.post('/email', cors(), function(req, res) {
  var {sendTo, subject, text, slackOption} = req.body;
  if (!sendTo || !subject || !text){
    var emessage = 'You\'re missing something: \n';
    if (!sendTo){
      emessage+= 'You need a recieving address. \n';
    }
    if (!subject){
      emessage+= 'You need a subject line. \n';
    }
    if (!text){
      emessage+= 'You need some content. \n';
    }
    return res.status(400).json({message:emessage});
  }
  if(slackOption){
    request.post(
      process.env.SLACK,
      { json:
        { text: `****************************************************\n\n
        ${subject}: \n ${text}\n\n
        ****************************************************` }
      },
      function (error, response, body) {
          if (!error && response.statusCode == 200) {
              return res.status(200).json({message:'The email was sent!'});
          } else {
            text += '\n Also, Slack failed to report this.';
            mailOption();
          }
      }
    );
} else {
  mailOption();
}
  function mailOption() {
    var mailOptions = {
        to: sendTo,
        from: process.env.EMAIL,
        subject: subject,
        text: text,
    };

    smtpTransport.sendMail(mailOptions, function (err) {
      if (err){
        return res.status(404).json({message:'error: \n'+ err});
      }
        return res.status(200).json({message:'The email was sent!'});
    });
  }

});

app.listen(port,app_ip_address);
console.log('The magic happens on port ' + port);

module.exports = app;
