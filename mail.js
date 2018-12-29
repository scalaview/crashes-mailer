"use strict";
const Mailer = require("nodemailer");
const Fs = require("fs");

const Mail = function(config){
    this.config = config;
    this.template = "<!-- body -->\n<!-- timeStamp -->";
    if (!this.config.smtp)
        this.config.smtp = { disabled: true };
    if (this.config.smtp.disabled === true)
        return; // don't analyze config if disabled
    if (!this.config.smtp)
        throw new Error(`[smtp] not set`);
    if (!this.config.smtp.host)
        throw new Error(`[smtp.host] not set`);
    if (!this.config.smtp)
        throw new Error(`[smtp.port] not set`);
    if (!this.config.mailTo)
        throw new Error(`[mailTo] not set`);
    try {
        this.template = Fs.readFileSync("Template.txt", "utf8");
    }
    catch (e) {
        console.error(`Template.txt not found`);
    }
}

Mail.prototype.send = function(subject, body){
    if (this.config.smtp.disabled === true)
        return;
    var temp = {
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        tls: { rejectUnauthorized: false },
        secure: this.config.smtp.secure === true,
        auth: null
    };
    if (this.config.smtp.user){
        temp.auth = {
            user: this.config.smtp.user,
            pass: this.config.smtp.password
        };
    }
    var transport = Mailer.createTransport(temp), headers = {};
    var mailOptions = {
        to: this.config.mailTo,
        from: this.config.from,
        replyTo: this.config.replyTo,
        subject: `${this.config.prefix_subject}: ${subject}`,
        text: this.template
            .replace(/<!--\s*body\s*-->/, body)
            .replace(/<!--\s*timeStamp\s*-->/, new Date().toISOString()),
        attachments: [],
        headers
    }
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error(error);
        }
    });
}
module.exports = Mail