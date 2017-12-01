
const express = require('express')
const bodyParser = require('body-parser')
// logging lib
const winston = require('winston')

const app = express()
app.use(bodyParser.json());

const emailREGEX = new RegExp("^[a-zA-Z0-9.!#$%&*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$");

// Expected that viewer is not fully included in the editor role, so user can have more roles than one. Prepared for more roles in the future.
const roles = { 'viewer': {'optionText': 'Can view'}, 'editor': {'optionText': 'Can edit' }}

// using object as temporary storage of sent invites. In full app, there will be probably DB and 
var userRoles = {};
// we will be saving also audit data (who send invite to whom) and it will be connected to user management
for ( k in roles ) {
    userRoles[k] = {} 
}


// standart static serving for SAP - As the form is taken out from larger project, I am expecting that 
// autorization and autentization is done with Oauth tokens and cookies or something similar. 
// I am not implementing it here 
app.use(express.static('public'))

// ENDPOINTS - I have chosen REST api as it is fully sufficient for our job. 

// 1st endpoint for getting list of roles - used for dynamically loading available roles into the frontend selectbox.
// example returned JSON: { 'viewer': {'optionText': 'Can view'}, 'editor': {'optionText': 'Can edit' }}
app.get('/inviteapi/roles', function (req, res) {
    const logmsg = 'GET /inviteapi/roles -';
    winston.log('silly', logmsg, 'Called with', req.headers);
    res.json(roles);
    winston.log('silly', logmsg, 'Returned', roles);
})

// 2nd endpoint for getting list of already invited users (email address) for all roles.
// no need to narrow it down per role for now as probably page will be showing all invites with all roles.
// in final app there will be variable "project" to get list of all invited users per project. There will be possibly more variables...
// example returned JSON: {"viewer":["correct@email.test"],"editor":["correct1@email.test","correct2@email.test"]}
app.get('/inviteapi/invites', function (req, res) {
    const logmsg = 'GET /inviteapi/invites -';
    winston.log('debug', logmsg, 'Called with', req.headers);
    var userList = {};
    for ( k in userRoles ) {
        userList[k]=Object.keys(userRoles[k]);
    }
    res.json(userList);
    winston.log('debug', logmsg, 'Returned', userList);
})

// 3rd endpoint for posting list of email adresses with role, where the invites will be sent.
// All inputs must be checked and validated again for security reasons as we don't know who is sending the data. 
// So no need to use further some sanitization functions.
// example POST payload { 'emails' : 'correct@email.test', 'role' : 'editor' }
// endpoint returns: 
//      400 - Missing required data                     - if missing some data aas emails or invalid role
//      400 - At least one email was not validated
//      500 - Emails were not sent succesfully
//      200 - Success
app.post('/inviteapi/invites', function (req, res) {
    const logmsg = 'POST /inviteapi/invites -';
    winston.log('debug', logmsg, 'Called with', req.headers); 
    winston.log('debug', logmsg, 'Body' , req.body );
    // if missing data or unknown role send error.
    if (!(req.body.emails && req.body.role && roles[req.body.role])) {
            winston.log('warn', logmsg, 'Missing data in call, req.body: ' , req.body );
            res.status(400).send("Missing required data");
            return;
    }
    var role = req.body.role;
    //no space in emails so we can remove them all and create array
    var arrEmails = req.body.emails.replace(/\s/g, '').split(",");
    var invalidEmails = arrEmails.filter( x => !emailREGEX.test(x));
    if (invalidEmails.length > 0) {
            winston.log('verbose', logmsg, 'Emails ', invalidEmails, ' were not validated');
            res.status(400).send("At least one email was not validated");
            return;
    }
    // removing emails which have been already sent before and duplicate records. 
    var tmpEmails = [];
    for (var i = 0; i < arrEmails.length; i++) {
        if (!userRoles[role][arrEmails[i]]) {
            tmpEmails[arrEmails[i]] = 1;
        }
    }
    var emailsToSend = Object.keys(tmpEmails);

    try {
        // send static or template email based on role to emailsToSend.join(";") 
        winston.log('verbose', logmsg, 'Sending', role ,'role emails to:', emailsToSend );
        // nodemailer, sendmail etc...
    }
    catch(err) {
        res.status(500).send("Emails were not sent succesfully");
        winston.log('error', logmsg, 'Emails not sent! :', emailsToSend, ' ERR: ', err);
        return;
    }
    winston.log('info', logmsg, 'Emails were sent succesfully:', emailsToSend);
    
    // adding list of addresses to already sent invites
    for (var i = 0; i < emailsToSend.length; i++) {
        userRoles[role][emailsToSend[i]] = 1;
    }
    res.send('Success')
    
})

var server = app.listen(3000, () => console.log('invite app listening on port 3000!'))

module.exports = server
