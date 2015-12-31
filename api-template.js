// ---------------------------------------------------------------------------/
// Module Dependencies
// ---------------------------------------------------------------------------/
// Cluster module for better performance
var cluster = require('cluster');
// Express is needed to create the REST endpoints
var express = require('express');
// Module to avoid ddos attacks
var Ddos = require('ddos');
// Module to avoid too much load
var toobusy = require('toobusy-js');
// The logger module
var Logger = require('bunyan');
// Custom module that holds all app settings
var importSettings = require('./settings.js');


// Global scoped variables
var defaultSettings = importSettings.initializeSettings();
var app = express();
// expressServe holds the express web server
var expressServe;
var ddos;
// Initialize logger
var log = new Logger(defaultSettings.logger);

// ---------------------------------------------------------------------------/
// Cluster setup
// ---------------------------------------------------------------------------/
if (defaultSettings.cluster.enable && cluster.isMaster) {

    // Spawn workers
    log.info("Application started on cluster mode spawning %s processes", defaultSettings.cluster.workers);
    for (var i = 0; i < defaultSettings.cluster.workers; i++) {
        cluster.fork();
    }

    cluster.on('online', function (worker) {
        log.info('Worker ' + worker.process.pid + ' is online');
    });

    // If any worker craches then re launch it
    cluster.on('exit', function (worker, code, signal) {
        log.info('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        log.info('Starting a new worker');
        cluster.fork();
    });
} else { // Begin of cluster block


// ---------------------------------------------------------------------------/
// Debug messages
// ---------------------------------------------------------------------------/
    if (defaultSettings.general.debug) {
        log.info("Application started listening on port %s", defaultSettings.express.port);
    }

// ---------------------------------------------------------------------------/
// Express Ddos setup
// ---------------------------------------------------------------------------/
    if (defaultSettings.ddos.enable) {
        ddos = new Ddos(defaultSettings.ddos.settings);
        app.use(ddos.express);
    }


// ---------------------------------------------------------------------------/
// Busy checks
// ---------------------------------------------------------------------------/
    toobusy.maxLag(defaultSettings.tooBusy.maxLag);
    app.use(function (req, res, next) {
        if (toobusy()) {
            log.error(defaultSettings.tooBusy.busyMsg);
            res.status(503).send(defaultSettings.tooBusy.busyMsg);
        } else {
            next();
        }
    });


// ---------------------------------------------------------------------------/
// Start Declaring Express Endpoints
// ---------------------------------------------------------------------------/
// Add to list endpoint
    app.get(defaultSettings.express.myendpoint, function (req, res, next) {

        var host = req.headers['host'];
        log.info('incomming request from %s', host);
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=UTF-8'
        });

        res.end('Hello from ' + host);
    });


// ---------------------------------------------------------------------------/
// Define listening port
// ---------------------------------------------------------------------------/
    expressServe = app.listen(defaultSettings.express.port);


// ---------------------------------------------------------------------------/
// Close normally on load
// ---------------------------------------------------------------------------/
    process.on('SIGINT', function () {
        expressServe.close();
        // calling .shutdown allows your process to exit normally
        toobusy.shutdown();
        process.exit();
    });

} // End of cluster block
