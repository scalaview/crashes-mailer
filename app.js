const pmx = require("pmx");
const pm2       = require('pm2');
const fs = require('fs');
const Mail = require('./mail');
const loki = require('lokijs')


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
    const db = new loki('./crashes.json', {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000
    });
    var crashelogs = db.getCollection("crashelogs");
    if (crashelogs === null) {
        crashelogs = db.addCollection("crashelogs");
    }

    pm2.launchBus(function(err, bus) {
        bus.on('log:err', function(data) {
            if(config.monitor_processes.indexOf(data.process.name) !== -1 ){
                var record = n_times_filter(crashelogs, data.data)
                if(record == null)
                    return
                var times = record.count > 0 ? "" : `${record.count} times`
                mailer.send(`${data.process.name} ${times} ${data.data.slice(0, 100)}`, data.data)
            }
        });
    });
});


function n_times_filter(crashelogs, body){
    var content =  body.slice(0, 100),
        result = crashelogs.findOne({ content: content });
    if(result == null){
        result = { content: content, count: 0 }
        crashelogs.insert(result);
    }else{
        result.count += 1
        crashelogs.update(result)
    }
    if([0, 10, 100].indexOf(result.count) !== -1){
        return result
    }else{
        return null
    }
}

