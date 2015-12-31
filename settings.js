var pjson = require('./package.json');
var defaultConfig = {
    general: {
        debug: true
    },
    cluster: {
        enable: false,
        workers: 4
    },
    express: {
        port: process.env.EXPRESS_PORT || 3000,
        myendpoint: '/myendpoint/'
    },
    tooBusy: {
        busyMsg: 'The server is too busy at the moment. Please try again later',
        maxLag: 80
    },
    ddos: {
        enable: false,
        settings: {
            maxcount: 30,
            burst: 5,
            limit: 20,
            maxexpiry: 128,
            checkinterval: 1,
            errormessage: 'You have performed too many requests!!!',
            testmode: false,
            silent: false,
            silentStart: false
        }
    },
    logger: {
        name: pjson.name,
        streams: [
            {
                type: 'rotating-file',
                path: pjson.name + '.log',
                period: '1w', // weekly rotation
                count: 4      // keep 4 back copies
            },
            {
                stream: process.stdout,
                level: 'debug'
            }
        ]
    }
};

function initializeSettings() {

    // If there is cluster mode enabled then disable bunyan log rotations 
    // since it is buggy
    if (defaultConfig.cluster.enable) {
        for (var i = 0; i < defaultConfig.logger.streams.length; i++) {
            if (defaultConfig.logger.streams[i].hasOwnProperty('type')){
                delete defaultConfig.logger.streams[i].type;
            }
            if (defaultConfig.logger.streams[i].hasOwnProperty('period')){
                delete defaultConfig.logger.streams[i].period;
            }
            if (defaultConfig.logger.streams[i].hasOwnProperty('count')){
                delete defaultConfig.logger.streams[i].count;
            }
        }
    }

    return defaultConfig;
}

exports.initializeSettings = initializeSettings;

