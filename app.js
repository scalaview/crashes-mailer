const pmx = require("pmx");
const pm2       = require('pm2');
const fs = require('fs');
const Mail = require('./mail');


pmx.initModule({
    type: "generic",
    el: {
        probes: false,
        actions: true
    },
    block: {
        actions: true,
        cpu: true,
        mem: true
    }
}, async (ex, config) => {
    const mailer = new Mail(config)
    pm2.launchBus(function(err, bus) {
        bus.on('log:err', function(data) {
            if(config.monitor_processes.indexOf(data.process.name) !== -1 )
                mailer.send(`${data.process.name} ${data.data.slice(0, 100)}`, data.data)
        });
    });
});

