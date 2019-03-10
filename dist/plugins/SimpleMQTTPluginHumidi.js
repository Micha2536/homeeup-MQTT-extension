"use strict";
exports.__esModule = true;
var Logger = require('logplease');
var logger = Logger.create('SimpleMQTTPluginHumidi');
var mqtt = require('mqtt');
var HMWDS40THI_1 = require("../devices/HMWDS40THI");
var SimpleMQTTPluginHumidi = /** @class */ (function () {
    function SimpleMQTTPluginHumidi() {
        this.name = 'SimpleMQTTPluginHumidi';
        this.devices = [];
        //states and vars
        this.mqttAvailable = false;
        this.mqttConnection = null;
    }
    SimpleMQTTPluginMotion.prototype.init = function (p) {
        logger.debug('init(%s)', JSON.stringify(p));
        this.mqttServer = p.pluginParams.mqttServer;
        this.mqttUserName = p.pluginParams.mqttUserName;
        this.mqttPassword = p.pluginParams.mqttPassword;
        this.mqttPublishOnTopic = p.pluginParams.mqttOnTopic;
        this.mqttPublishOffTopic = p.pluginParams.mqttOffTopic;
        if (p.pluginParams.mqttPublishOnTopic) {
            this.mqttPublishOnTopic = p.pluginParams.mqttPublishOnTopic;
        }
        if (p.pluginParams.mqttPublishOffTopic) {
            this.mqttPublishOffTopic = p.pluginParams.mqttPublishOffTopic;
        }
        else {
            this.mqttPublishOffTopic = this.mqttPublishOnTopic;
        }
        if (p.pluginParams.mqttSubscribeOnTopic) {
            this.mqttSubscribeOnTopic = p.pluginParams.mqttSubscribeOnTopic;
        }
        else {
            this.mqttSubscribeOnTopic = this.mqttPublishOnTopic;
        }
        if (p.pluginParams.mqttSubscribeOffTopic) {
            this.mqttSubscribeOffTopic = p.pluginParams.mqttSubscribeOffTopic;
        }
        else {
            this.mqttSubscribeOffTopic = this.mqttSubscribeOnTopic;
        }
        if (p.pluginParams.mqttMessageMode) {
            this.mqttMessageMode = p.pluginParams.mqttMessageMode;
        }
        else {
            this.mqttMessageMode = "value";
        }
        var device = new HMWDS40THI_1.HMWDS40THI(p.deviceName);
//        device.events.on('onTurnOn', this.onTurnOn.bind(this));
//        device.events.on('onTurnOff', this.onTurnOff.bind(this));
        this.devices.push(device);
        var that = this;
        this.mqttConnect();
        logger.info('Plugin %s initialized.', this.name);
        return this.devices;
    };
//    SimpleMQTTPluginHumidi.prototype.onTurnOn = function (device) {
//        logger.debug('onTurnOn()');
//        logger.info('Device %s turned on.', device.deviceName);
//        this.mqttPublish(this.mqttPublishOnTopic, '1');
//    };
//    SimpleMQTTPluginHumidi.prototype.onTurnOff = function (device) {
//        logger.debug('onTurnOff()');
//        logger.info('Device %s turned off.', device.deviceName);
//        this.mqttPublish(this.mqttPublishOffTopic, '0');
//    };
    SimpleMQTTPluginHumidi.prototype.mqttConnect = function () {
        if (this.mqttUserName) {
            this.mqttConnection = mqtt.connect('mqtt://' + this.mqttServer, {
                username: this.mqttUserName,
                password: this.mqttPassword
            });
        }
        else {
            this.mqttConnection = mqtt.connect('mqtt://' + this.mqttServer, {});
        }
        var that = this;
        this.mqttConnection.on('connect', function () {
            logger.info('MQTT connected');
            that.mqttAvailable = true;
            that.mqttSubscribe(that.mqttSubscribeOnTopic);
            if (that.mqttSubscribeOnTopic !== that.mqttSubscribeOffTopic) {
                that.mqttSubscribe(that.mqttSubscribeOffTopic);
            }
        });
        this.mqttConnection.on('message', function (topic, message) {

            that.handleIncommingSubscribedMqttMessage(that, topic, message);
        });
    };
    SimpleMQTTPluginHumidi.prototype.mqttPublish = function (mqttTopic, mqttMessage) {
        if (this.mqttAvailable) {
            logger.debug('publish to', mqttTopic, mqttMessage);
            this.mqttConnection.publish(mqttTopic, mqttMessage);
        }
    };
    SimpleMQTTPluginHumidi.prototype.mqttSubscribe = function (mqttTopic) {
        if (this.mqttAvailable) {
            logger.info('"subscribing: "' + mqttTopic + '"');
            this.mqttConnection.subscribe(mqttTopic, null, function (err) {
                if (err) {
                    logger.error(err, '" subscribing: "' + mqttTopic + '"');
                }
                else {
                    logger.info('"subscribed: "' + mqttTopic + '"');
                }
            });
        }
    };
    SimpleMQTTPluginHumidi.prototype.handleIncommingSubscribedMqttMessage = function (that, topic, message) {
        logger.info("subscribed mqtt message received:", topic, message.toString());
        var device = that.devices[0];
        var val;
        if (that.mqttMessageMode == "value") {
            var messageString = message.toString().toLowerCase();
            if (messageString ) {
                val = messageString;
            }
            else {
                val = 0;
            }
        }
        else {
            if (topic === that.mqttSubscribeOnTopic) {
                val = 1;
            }
            else {
                val = 0;
            }
        }
        if (val !== device.state1) {
            logger.info('Status of %s changed to %s.', device.deviceName, message);
            device.humidityChanged(1, val);
        }
        else {
            logger.info('Status of %s has not changed.', device.deviceName);
        }
    };
    return SimpleMQTTPluginHumidi;
}());
exports.SimpleMQTTPluginHumidi = SimpleMQTTPluginHumidi;
