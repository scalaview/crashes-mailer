const pmx = require("pmx");
const pm2       = require('pm2');
const fs = require('fs');
const Mail = require('./mail');
const loki = require('lokijs');
const lfsa = require('lokijs/src/loki-fs-structured-adapter');
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
    var lfsaAdapter = new lfsa();
    var db = new loki('/tmp/crashes.json', {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
        adapter: lfsaAdapter
    });
    db.loadDatabase({});
    var crashelogs = db.getCollection("crashelogs");
    if (crashelogs === null) {
        crashelogs = db.addCollection("crashelogs");
    }

    pm2.launchBus(function(err, bus) {
        bus.on('log:err', function(data) {
            if(config.monitor_processes.indexOf(data.process.name) !== -1 ){
                var record = n_times_filter(config, db, crashelogs, data.data)
                if(record == null)
                    return
                var times = record.count > 0 ? `${record.count} times` : ""
                mailer.send(`${data.process.name} ${times} ${data.data.slice(0, 100)}`, data.data)
            }
        });
    });
});

function n_times_filter(config, db, crashelogs, body){
    let content =  body.slice(0, 100),
        now = (new Date()).getTime(),
        interval = config.interval,
        results = crashelogs.find({timestamp: { $gt: now - interval }}),
        target = null

    if(results == null || results.length <= 0){
        target = { content: content, count: 0, timestamp: now }
        crashelogs.insert(target);
    }else{
        let findOne = false;
        for(let i=0; i<results.length; i++){
            var result = results[i]
            if( natural.JaroWinklerDistance(result.content, content) > 0.6 ){ // consider tow content are same
                target = result
                target.count += 1
                crashelogs.update(target)
                findOne = true
                break
            }
        }
        if(!findOne){
            target = { content: content, count: 0, timestamp: now }
            crashelogs.insert(target);
        }
    }
    db.saveDatabase();
    if(config.times.indexOf(target.count) !== -1){
        return target
    }else{
        return null
    }
}

