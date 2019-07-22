const pmx = require("pmx");
const pm2       = require('pm2');
const fs = require('fs');
const Mail = require('./mail');
const loki = require('lokijs');
const natural = require('natural');

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
    const db = new loki('/tmp/crashes.json', {
        autoload: true,
        autosave: true,
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
                var times = record.count > 0 ? `${record.count} times` : ""
                mailer.send(`${data.process.name} ${times} ${data.data.slice(0, 100)}`, data.data)
            }
        });
    });
});

function n_times_filter(crashelogs, body){
    let content =  body.slice(0, 100),
        now = (new Date()).getTime(),
        twoHours = (2 * 60 * 60 * 1000),
        results = crashelogs.find({timestamp: { $gt: now - twoHours }});

    if(results == null || results.length <= 0){
        var result = { content: content, count: 0, timestamp: now }
        crashelogs.insert(result);
    }else{
        let findOne = false;
        for(let i=0; i<results.length; i++){
            var result = results[i]
            if( natural.JaroWinklerDistance(result.content, content) > 0.6 ){ // consider tow content are same
                result.count += 1
                result.timestamp = now
                crashelogs.update(result)
                findOne = true
                break
            }
        }
        if(!findOne){
            var result = { content: content, count: 0, timestamp: (new Date()).getTime() }
            crashelogs.insert(result);
        }
    }
    db.saveDatabase();
    if([0, 10, 100].indexOf(result.count) !== -1){
        return result
    }else{
        return null
    }
}

