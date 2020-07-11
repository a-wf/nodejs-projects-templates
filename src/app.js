'use strict';

try {
    const cluster = require('cluster');
    const config = require('./config');

    const Logger = require('./libs/logger');

    if (!config) {
        throw new Error('No config provided');
    }

    var logger = new Logger(config.log);

    if (cluster.isMaster && !module.parent) {
        try {
            var numWorkers = require('os').cpus().length;
            logger.Debug('Master', 'Init', 'Master cluster setting up ' + numWorkers + ' workers...');

            for (var i = 0; i < numWorkers; i++) {
                cluster.fork();
            }

            cluster.on('online', function (worker) {
                logger.Debug('Master', 'Init', 'Worker process PID ' + worker.process.pid + ' is online');
            });

            cluster.on('exit', function (worker, code, signal) {
                logger.Debug('Master', 'Init', 'Worker process PID ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
                logger.Debug('Master', 'Init', 'Starting a new worker');
                cluster.fork();
            });
        } catch (error) {
            logger.Error('Master', 'Init', error.message);
        }
    } else {
        try {
            const OpenApiValidator = require('express-openapi-validator').OpenApiValidator;
            const swaggerUi = require('swagger-ui-express');

            const promBundle = require('express-prom-bundle'),
                bodyParser = require('body-parser'),
                express = require('express'),
                jsyaml = require('js-yaml'),
                https = require('https'),
                http = require('http'),
                fs = require('fs');

            const app = express();

            const controllers = require('./controllers');

            logger.Debug('Worker', 'Init', `process PID ${process.pid} is running`);

            if (config.monitor.enable) {
                var metricsMiddleware = promBundle({ includeMethod: true, includePath: true });
                app.use(metricsMiddleware);
            }
            app.use(bodyParser.json());

            if (config.server.apiDoc) {
                var spec = fs.readFileSync(__dirname + '/api/api.yaml', 'utf8');
                var swaggerDoc = jsyaml.safeLoad(spec);
                app.use('/v1/doc', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
            }

            new OpenApiValidator({
                apiSpec: __dirname + '/api/api.yaml',
                validateRequests: true, // (default)
                validateResponses: true, // false by default
            }).install(app)
                .then(() => {

                    app.use('/v1/', controllers(logger));

                    app.use((err, req, res, next) => {
                        res.status(err.status || 500).json({
                            message: err.message,
                            errors: err.errors,
                        });
                    });

                    if (config.server.protocol === 'https') {
                        var privateKey = fs.readFileSync(config.server.ssl.key, 'utf8');
                        var certificate = fs.readFileSync(config.server.ssl.certificate, 'utf8');

                        https.createServer({
                            key: privateKey,
                            cert: certificate
                        }, app).listen(config.server.port || 443);

                        logger.Info('Worker', 'Init', `process PID ${process.pid}: listening on port ${config.server.port || 443} via protocol https`);

                    } else if (config.server.protocol === 'http') {

                        http.createServer(app).listen(config.server.port || 80);
                        logger.Info('Worker', 'Init', `process PID ${process.pid}: listening on port ${config.server.port || 80} via protocol http`);

                    } else {
                        throw new Error(`unknown server\'s protocol`);
                    }
                }).catch((error) => {
                    throw error;
                });

            module.exports = app;

        } catch (error) {
            logger.Error('Worker', 'Init', error.stack);
        }
    }
} catch (error) {
    if (logger) {
        logger.Error('App', 'Init', error.message);
    } else {
        console.log(error);
    }
}