// 'use strict';

// var User = require('../user/user.model');
// var config = require('../../config/environment');
// var jwt = require('jsonwebtoken');

// var Mailgun = require('mailgun-js');
// var api_key = config.mailgunApiKey;
// var from_who = config.mailgunFromWho;
// var domain = 'getbodyapp.com';  

//   // Send a message to the specified email address when you navigate to /submit/someaddr@email.com
// // The index redirects here
// exports.submitEmail = function(req,res) {
// 	console.log("trying to submit email")
//     //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
//     var mailgun = new Mailgun({apiKey: api_key, domain: domain});

//     var data = {
//     //Specify email data
//       from: from_who,
//     //The email to contact
//       to: req.params.mail,
//     //Subject and text data  
//       subject: 'Hello from Mailgun',
//       html: 'Hello, This is not a plain-text email, I wanted to test some spicy Mailgun sauce in NodeJS! <a href="http://0.0.0.0:3030/validate?' + req.params.mail + '">Click here to add your email address to a mailing list</a>'
//     }

//     //Invokes the method to send emails given the above data with the helper library
//     mailgun.messages().send(data, function (err, body) {
//         //If there is an error, render the error page
//         if (err) {
//             res.render('error', { error : err});
//             console.log("got an error: ", err);
//         }
//         //Else we can greet    and leave
//         else {
//             //Here "submitted.jade" is the view file for this landing page 
//             //We pass the variable "email" from the url parameter in an object rendered by Jade
//             res.render('submitted', { email : req.params.mail });
//             console.log(body);
//         }
//     });
// });

// exports.validateEmail = function(req,res) {
//     var mailgun = new Mailgun({apiKey: api_key, domain: domain});

//     var members = [
//       {
//         address: req.params.mail
//       }
//     ];
// //For the sake of this tutorial you need to create a mailing list on Mailgun.com/cp/lists and put its address below
//     mailgun.lists('NAME@MAILINGLIST.COM').members().add({ members: members, subscribed: true }, function (err, body) {
//       console.log(body);
//       if (err) {
//             res.send("Error - check console");
//       }
//       else {
//         res.send("Added to mailing list");
//       }
//     });

// })

// exports.invoiceEmail = function(req,res){
//     //Which file to send? I made an empty invoice.txt file in the root directory
//     //We required the path module here..to find the full path to attach the file!
//     var path = require("path");
//     var fp = path.join(__dirname, 'invoice.txt');
//     //Settings
//     var mailgun = new Mailgun({apiKey: api_key, domain: domain});

//     var data = {
//       from: from_who,
//       to: req.params.mail,
//       subject: 'An invoice from your friendly hackers',
//       text: 'A fake invoice should be attached, it is just an empty text file after all',
//       attachment: fp
//     };


//     //Sending the email with attachment
//     mailgun.messages().send(data, function (error, body) {
//         if (error) {
//             res.render('error', {error: error});
//         }
//             else {
//             res.send("Attachment is on its way");
//             console.log("attachment sent", fp);
//             }
//         });
// })