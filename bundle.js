(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// The EasyRTC server files are in the lib folder
module.exports = require('./lib/easyrtc_server');
},{"./lib/easyrtc_server":6}],2:[function(require,module,exports){
(function (__dirname){
/**
 * Event listeners used by EasyRTC. Many of these can be overridden using server options.
 * 
 * @module      easyrtc_default_event_listeners
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var util        = require("util");                  // General utility functions core module
var _           = require("underscore");            // General utility functions external module
var g           = require("./general_util");        // General utility functions local module

var async       = require("async");                 // Asynchronous calls external module

var pub         = require("./easyrtc_public_obj");  // EasyRTC public object

/**
 * Event listeners used by EasyRTC. Many of these can be overridden using server options. The interfaces should be used as a guide for creating new listeners.
 *
 * @class 
 */
eventListener = module.exports;

/**
 * Default listener for event "authenticate". This event is called as part of the authentication process. To deny authentication, call the next() with an Error. By default everyone gets in!
 * 
 * @param       {Object} socket         Socket.io socket object. References the individual connection socket. 
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {?String} username      Username to assign to the connection.
 * @param       {?*} credential         Credential for the connection. Can be any JSONable object.
 * @param       {Object} easyrtcAuthMessage Message object containing the complete authentication message sent by the connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onAuthenticate = function(socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next) {
    next(null);
};


/**
 * Default listener for event "authenticated". This event is called after a connection is authenticated and the connection object is generated and requested rooms are joined. Call next(err) to continue the connection procedure.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onAuthenticated = function(connectionObj, next) {
    next(null);
};


/**
 * Default listener for event "connection". This event is called when socket.io accepts a new connection.
 *
 * @param       {Object} socket         Socket.io socket object. References the individual connection socket. 
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onConnection = function(socket, easyrtcid, next){
    var connectionObj = {};             // prepare variables to house the connection object

    // Initially upon a connection, we are only concerned with receiving an easyrtcAuth message
    socket.on("easyrtcAuth", function(msg, socketCallback) {

        if (pub.getOption("logMessagesEnable")) {
            try {
                pub.util.logDebug("["+easyrtcid+"] Incoming socket.io message: ["+JSON.stringify(msg)+"]");
            }
            catch(err) {
                pub.util.logDebug("["+easyrtcid+"] Incoming socket.io message");
            }
        }

        pub.events.emit("easyrtcAuth", socket, easyrtcid, msg, socketCallback, function(err, newConnectionObj){
            if(err){
                pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd listener error.", err);
                return;
            }

            connectionObj = newConnectionObj;
        });
    });

    pub.util.logDebug("Running func 'onConnection'");
    next(null);
};


/**
 * Default listener for event "disconnect". This event is called when socket.io detects a disconnection. Disconnections can occur due to either side purposefully dropping a connection, network disconnection, or time out. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onDisconnect = function(connectionObj, next){
    pub.util.logDebug("Running func 'onDisconnect'");

    async.waterfall([
        function(asyncCallback) {
            // Get array of rooms
            connectionObj.getRoomNames(asyncCallback);
        },
        function(roomNames, asyncCallback) {
            // leave all rooms
            async.each(roomNames,
                function(currentRoomName, asyncEachCallback) {
                    pub.events.emit("roomLeave", connectionObj, currentRoomName, function(err){asyncEachCallback(null);});
                },
                function(err){
                    asyncCallback(null);
                }
            );
        },
        function(asyncCallback) {
            // log all connections as ended
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Disconnected");
            connectionObj.removeConnection(asyncCallback);
        }
    ], function(err) {
        next(null);
    });

    next(null);
};


/**
 * Default listener for event "easyrtcAuth". This event is fired when an incoming 'easyrtcAuth' message is received from a client.
 *
 * @param       {Object}    socket         Socket.io socket object. References the individual connection socket.
 * @param       {String}    easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {Object}    msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {Function}  socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {Function}  callback       Callback to call upon completion. Delivers parameter (err, connectionObj).
 */
eventListener.onEasyrtcAuth = function(socket, easyrtcid, msg, socketCallback, callback){
    pub.util.logDebug("["+easyrtcid+"] Running func 'onEasyrtcAuth'");

    var appObj, connectionObj, sessionObj;  // prepare variables to house the application, connection, and session objects

    var tokenMsg = {
        msgType: "token",
        msgData:{}
    };

    var appName;
    var newAppName = (_.isObject(msg.msgData) &&_.isString(msg.msgData.applicationName)) ? msg.msgData.applicationName : pub.getOption("appDefaultName");

    // Ensure socketCallback is present
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received with no callback. Disconnecting socket.", msg);
        try{socket.disconnect();}catch(e){}
        return;
    }

    // Only accept authenticate message
    if(!_.isObject(msg) || !_.isString(msg.msgType) || msg.msgType != "authenticate") {
        pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received without msgType of 'authenticate'. Disconnecting socket.", msg);
        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_AUTH"), appObj);
        try{socket.disconnect();}catch(e){}
        return;
    }

    // Check msg structure.
    if(!_.isObject(msg.msgData)
        || !_.isString(msg.msgData.apiVersion)
        || (msg.msgData.roomJoin !== undefined && !_.isObject(msg.msgData.roomJoin))
    ) {
        pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received with improper msgData. Disconnecting socket.", msg);
        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_STRUCTURE"), appObj);
        try{socket.disconnect();}catch(e){}
        return;
    }

    async.waterfall([
        function(asyncCallback) {
            // Check message structure
            pub.util.isValidIncomingMessage("easyrtcAuth", msg, null, asyncCallback);
        },

        function(isMsgValid, msgErrorCode, asyncCallback) {
            // If message structure is invalid, send error, disconnect socket, and write to log
            if (!isMsgValid) {
                try{
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg(msgErrorCode), appObj);
                    socket.disconnect();
                }catch(e){}
                pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received with invalid message format [" + msgErrorCode + "]. Disconnecting socket.", msg);
                callback(new pub.util.ConnectionError("["+easyrtcid+"] EasyRTC Auth message received with invalid message format [" + msgErrorCode + "]. Disconnecting socket."));
                return;
            }

            // Remove any old listeners
            socket.removeAllListeners("easyrtcCmd");
            socket.removeAllListeners("easyrtcMsg");
            socket.removeAllListeners("disconnect"); // TODO: Come up with alternative to removing all disconnect listeners

            pub.util.logDebug("Emitting Authenticate");

            var username    = (msg.msgData.username     ? msg.msgData.username  : null);
            var credential  = (msg.msgData.credential   ? msg.msgData.credential: null);

            // Authenticate is responsible for authenticating the connection
            pub.events.emit("authenticate", socket, easyrtcid, newAppName, username, credential, msg, function(err){
                if (err) {
                    try{
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_AUTH"), appObj);
                        socket.disconnect();
                        pub.util.logInfo("["+newAppName+"]["+easyrtcid+"] Authentication denied. Socket disconnected.", err);
                    }catch(e){}
                } else {
                    asyncCallback(null);
                }
            });
        },

        function(asyncCallback) {
            // Check to see if the requested app currently exists.
            pub.isApp(newAppName, asyncCallback);

        },

        function(isApp, asyncCallback) {
            // If requested app exists, then call it, otherwise create it.
            if (isApp) {
                pub.app(newAppName, asyncCallback);
            } else {
                // if appAutoCreateEnable is true, then a new app will be created using the default options
                if(pub.getOption("appAutoCreateEnable")) {
                    pub.createApp(newAppName, null, asyncCallback);
                } else {
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_APP_AUTH_FAIL"), appObj);
                    socket.disconnect();
                    pub.util.logWarning("[" + easyrtcid + "] Authentication failed. Requested application not found [" + newAppName + "]. Socket disconnected.");
                }
            }
        },

        function(newAppObj, asyncCallback) {
            // Now that we have an app, we can use it
            appObj = newAppObj;
            appName = appObj.getAppName();

            appObj.isConnected(easyrtcid, asyncCallback);
        },

        function(isConnected, asyncCallback) {
            // If socket has previously connected, disconnect them.
            if (isConnected){
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_APP_AUTH_FAIL"), appObj);
                socket.disconnect();
                pub.util.logWarning("[" + easyrtcid + "] Authentication failed. Already connected. Socket disconnected.");
                return;
            }

            // if roomJoin is present in message, check the room names
            if (msg.msgData.roomJoin) {
                for (var currentRoomName in msg.msgData.roomJoin) {
                    if (!_.isString(currentRoomName) || !appObj.getOption("roomNameRegExp").test(currentRoomName)) {
                        pub.events.emit("emitReturnError", socketCallback, "MSG_REJECT_TARGET_ROOM", pub.util.nextToNowhere);
                        pub.util.logInfo("[" + easyrtcid + "] Authentication failed. Requested room name not allowed [" + currentRoomName + "].");
                        return;
                    }
                }
            }
            asyncCallback(null);
        },

        function(asyncCallback) {
            // Create the connection object
            appObj.createConnection(easyrtcid, asyncCallback);
        },


        function(newConnectionObj, asyncCallback) {
            connectionObj = newConnectionObj;

            // Check if there is an easyrtcsid
            if (_.isString(msg.msgData.easyrtcsid)) {
                appObj.isSession(msg.msgData.easyrtcsid, function(err, isSession){
                    if (err) {
                        asyncCallback(err);
                        return;
                    }
                    if (isSession) {
                        appObj.session(msg.msgData.easyrtcsid, asyncCallback);
                    } else {
                        appObj.createSession(msg.msgData.easyrtcsid, asyncCallback);
                    }
                });
            }
            else {
                asyncCallback(null, null);
            }
        },

        function(newSessionObj, asyncCallback) {
            if (!newSessionObj) {
                asyncCallback(null);
                return;
            }
            sessionObj = newSessionObj;
            connectionObj.joinSession(sessionObj.getEasyrtcsid(), asyncCallback);
        },

        function(asyncCallback) {
            // Set connection as being authenticated (we pre-authenticated)
            connectionObj.setAuthenticated(true, asyncCallback);
        },

        function(asyncCallback) {
            // Set username (if defined)
            if (msg.msgData.username !== undefined) {
                connectionObj.setUsername(msg.msgData.username, asyncCallback);
            } else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Set credential (if defined)
            if (msg.msgData.username !== undefined) {
                connectionObj.setCredential(msg.msgData.credential, asyncCallback);
            } else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Set presence (if defined)
            if (_.isObject(msg.msgData.setPresence)) {
                connectionObj.setPresence(msg.msgData.setPresence,asyncCallback);
            } else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Join a room. If no rooms are defined than join the default room
            if (_.isObject(msg.msgData.roomJoin) && !_.isEmpty(msg.msgData.roomJoin)) {
                async.each(Object.keys(msg.msgData.roomJoin), function(currentRoomName, roomCallback) {

                    appObj.isRoom(currentRoomName, function(err, isRoom){
                        if(err) {
                            roomCallback(err);
                            return;
                        }

                        // Set roomParameter map. This may be used by custom listeners.
                        var currentRoomParameter;
                        if (msg.msgData.roomJoin[currentRoomName] && _.isObject(msg.msgData.roomJoin[currentRoomName].roomParameter)){
                            currentRoomParameter = msg.msgData.roomJoin[currentRoomName].roomParameter;
                        }

                        if (isRoom) {
                            // Join existing room
                            pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
                        }
                        else if (appObj.getOption("roomAutoCreateEnable")) {
                            // Room doesn't yet exist, however we are allowed to create it.
                            pub.events.emit("roomCreate", appObj, connectionObj, currentRoomName, null, function(err, roomObj){
                                if (err) {
                                    roomCallback(err);
                                    return;
                                }
                                pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
                            });
                        }
                        else {
                            // Can't join room and we are not allowed to create it. Error Out.
                            try{
                                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_ROOM"), appObj);
                                socket.disconnect();
                            }catch(e){}
                            pub.util.logInfo("[" + easyrtcid + "] Authentication failed. Requested room name does not exist [" + currentRoomName + "].");
                        }
                    });
                }, function(err, newRoomObj) {
                    asyncCallback(err);
                });
            }

            // If no room is initially provided, have them join the default room (if enabled)
            else if (connectionObj.getApp().getOption("roomDefaultEnable")) {
                pub.events.emit("roomJoin", connectionObj, connectionObj.getApp().getOption("roomDefaultName"), null, function(err, roomObj){
                    asyncCallback(err);
                });
            }

            // No room provided, and can't join default room
            else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Add new listeners
            socket.on("easyrtcCmd", function(msg, socketCallback){
                if (pub.getOption("logMessagesEnable")) {
                    try {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message: ["+JSON.stringify(msg)+"]");
                    }
                    catch(err) {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message");
                    }
                }

                pub.events.emit("easyrtcCmd", connectionObj, msg, socketCallback, function(err){
                    if(err){pub.util.logError("["+appName+"]["+easyrtcid+"] Unhandled easyrtcCmd listener error.", err);}
                });

            });
            socket.on("easyrtcMsg", function(msg, socketCallback){
                if (pub.getOption("logMessagesEnable")) {
                    try {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message: ["+JSON.stringify(msg)+"]");
                    }
                    catch(err) {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message");
                    }
                }

                pub.events.emit("easyrtcMsg", connectionObj, msg, socketCallback, function(err){
                    if(err){pub.util.logError("["+appName+"]["+easyrtcid+"] Unhandled easyrtcMsg listener error.", err);}
                });
            });
            socket.on("disconnect", function(){
                pub.events.emit("disconnect", connectionObj, function(err){
                    if(err){pub.util.logError("["+appName+"]["+easyrtcid+"] Unhandled disconnect listener error.", err);}
                });
            });
            asyncCallback(null);
        },

        function(asyncCallback){
            pub.events.emit("authenticated", connectionObj, asyncCallback);
        },

        function(asyncCallback){
            pub.events.emit("emitReturnToken", connectionObj, socketCallback, asyncCallback);
        },

        function(asyncCallback){

            // TODO: Reinstate this emit function by setting flag for roomJoin event so it doesn't automatically emit delta's
            // Emit clientList delta to other clients in room
            // connectionObj.emitRoomDataDelta(false, function(err, roomDataObj){asyncCallback(err);});
            asyncCallback(null);
        }

    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        if (err){
            try{
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_GEN_FAIL"), appObj);
                socket.disconnect();
                pub.util.logError("["+easyrtcid+"] General authentication error. Socket disconnected.", err);
            }catch(e){}
        } else {
            callback(null, connectionObj);
        }
    });
};


/**
 * Default listener for event "easyrtcCmd". This event is fired when an incoming 'easyrtcCmd' message is received from a client.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEasyrtcCmd = function(connectionObj, msg, socketCallback, next){
    var appName = connectionObj.getAppName();
    var appObj = connectionObj.getApp();
    var easyrtcid = connectionObj.getEasyrtcid();


    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC command received with msgType [" + msg.msgType + "]");
    if (!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC command message received with no callback. Ignoring.", msg);
        return;
    }

    async.waterfall([
        function(asyncCallback) {
            // Check message structure
            pub.util.isValidIncomingMessage("easyrtcCmd", msg, connectionObj.getApp(), asyncCallback);
        },

        function(isMsgValid, msgErrorCode, asyncCallback) {
            // If message structure is invalid, send error, and write to log
            if (!isMsgValid) {
                try{
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg(msgErrorCode), appObj);
                }catch(e){}
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC Auth message received with invalid message format [" + msgErrorCode + "]. Disconnecting socket.", msg);
                return;
            }
            asyncCallback(null);
        },
        function(asyncCallback) {
            // The msgType controls how each message is handled
            switch(msg.msgType) {
                case "setUserCfg":
                    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] WebRTC setUserCfg command received. This feature is not yet complete.");
                    pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);
                    next(null);
                    break;

                case "setPresence":
                    pub.events.emit("msgTypeSetPresence", connectionObj, msg.msgData.setPresence, socketCallback, next);
                    break;

                case "setRoomApiField":
                    pub.events.emit("msgTypeSetRoomApiField", connectionObj, msg.msgData.setRoomApiField, socketCallback, next);
                    break;

                case "roomJoin":
                    pub.events.emit("msgTypeRoomJoin", connectionObj, msg.msgData.roomJoin, socketCallback, next);
                    break;

                case "roomLeave":
                    pub.events.emit("msgTypeRoomLeave", connectionObj, msg.msgData.roomLeave, socketCallback, next);
                    break;

                case "getIceConfig":
                    pub.events.emit("msgTypeGetIceConfig", connectionObj, socketCallback, next);
                    break;

                case "getRoomList":
                    pub.events.emit("msgTypeGetRoomList", connectionObj, socketCallback, next);
                    break;

                case "candidate":
                case "offer":
                case "answer":
                case "reject":
                case "hangup":
                    // Relay message to targetEasyrtcid
                    var outgoingMsg = {senderEasyrtcid: connectionObj.getEasyrtcid(), msgData:msg.msgData};

                    connectionObj.getApp().connection(msg.targetEasyrtcid, function(err,targetConnectionObj){
                        if (err){
                            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_EASYRTCID"), appObj);
                            pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Could not send WebRTC signal to client [" + msg.targetEasyrtcid + "]. They may no longer be online.");
                            return;
                        }
                        pub.events.emit("emitEasyrtcCmd", targetConnectionObj, msg.msgType, outgoingMsg, null, next);
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);
                        next(null);
                    });
                    break;

                default:
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_TYPE"), appObj);
                    pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Received easyrtcCmd message with unhandled msgType.", msg);
                    next(null);
            }
        }
    ],
    function(err) {
        if (err) {
            try {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Received easyrtcCmd message with general error.", msg);
            } catch(e){}
        }
    });
};


/**
 * Default listener for event "easyrtcMsg". This event is fired when an incoming 'easyrtcMsg' message is received from a client.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEasyrtcMsg = function(connectionObj, msg, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();


    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received of type [" + msg.msgType + "]");

    if (!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with no callback. Ignoring message.", msg);
        return;
    }

    async.waterfall([
        function(asyncCallback) {
            // Check message structure
            pub.util.isValidIncomingMessage("easyrtcMsg", msg, connectionObj.getApp(), asyncCallback);
        },

        function(isMsgValid, msgErrorCode, asyncCallback) {
            // If message structure is invalid, send error, and write to log
            if (!isMsgValid) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg(msgErrorCode), appObj);
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with invalid message format [" + msgErrorCode + "].", msg);
                return;
            }
            asyncCallback(null);
        },
        function(asyncCallback) {

            // test targetEasyrtcid (if defined). Will prevent client from sending to themselves
            if (msg.targetEasyrtcid  !== undefined && msg.targetEasyrtcid == connectionObj.getEasyrtcid()) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_EASYRTCID"), appObj);
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper targetEasyrtcid", msg);
                return;
            }

            // Determine if sending message to single client, an entire room, or an entire group
            if (msg.targetEasyrtcid !== undefined) {
                // Relay a message to a single client
                var outgoingMsg = {
                    senderEasyrtcid: connectionObj.getEasyrtcid(),
                    targetEasyrtcid: msg.targetEasyrtcid,
                    msgType: msg.msgType,
                    msgData: msg.msgData
                };
                var targetConnectionObj = {};

                async.waterfall([
                    function(asyncCallback) {
                        // getting connection object for targetEasyrtcid
                        connectionObj.getApp().connection(msg.targetEasyrtcid, asyncCallback);
                    },
                    function(newTargetConnectionObj, asyncCallback) {
                        targetConnectionObj = newTargetConnectionObj;

                        // TODO: Add option to restrict users not in same room from sending messages to users in room

                        // Handle targetRoom (if present)
                        if (msg.targetRoom) {
                            targetConnectionObj.isInRoom(msg.targetRoom, function(err, isAllowed){
                                if (err || !isAllowed) {
                                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"), appObj);
                                    pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target room", msg);
                                    return;
                                }
                                outgoingMsg.targetRoom = msg.targetRoom;
                                asyncCallback(null);
                            });
                        }
                        else {
                            asyncCallback(null);
                        }
                    },

                    function(asyncCallback) {
                        // Handle targetGroup (if present)
                        if (msg.targetGroup) {
                            targetConnectionObj.isInGroup(msg.targetGroup, function(err, isAllowed){
                                if (err || !isAllowed) {
                                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"), appObj);
                                    pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target group", msg);
                                    return;
                                }
                                outgoingMsg.targetGroup = msg.targetGroup;
                                asyncCallback(null);
                            });
                        }
                        else {
                            asyncCallback(null);
                        }
                    },

                    function(asyncCallback) {
                        pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, asyncCallback);
                    }

                ],
                function (err) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
                        pub.util.logError("["+connectionObj.getEasyrtcid()+"] General message error. Message ignored.", err);
                    } else {
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);                    }
                });
            }

            else if (msg.targetRoom) {
                // Relay a message to one or more clients in a room

                var outgoingMsg = {
                    senderEasyrtcid: connectionObj.getEasyrtcid(),
                    targetRoom: msg.targetRoom,
                    msgType: msg.msgType,
                    msgData: msg.msgData
                };

                var targetRoomObj = null;

                async.waterfall([
                    function(asyncCallback){
                        // get room object
                        connectionObj.getApp().room(msg.targetRoom, asyncCallback);
                    },

                    function(newTargetRoomObj, asyncCallback) {
                        targetRoomObj = newTargetRoomObj;

                        // get list of connections in the room
                        targetRoomObj.getConnections(asyncCallback);
                    },

                    function(connectedEasyrtcidArray, asyncCallback) {
                        for (var i = 0; i < connectedEasyrtcidArray.length; i++) {
                            // Stop client from sending message to themselves
                            if (connectedEasyrtcidArray[i] == connectionObj.getEasyrtcid()) {
                                continue;
                            }

                            connectionObj.getApp().connection(connectedEasyrtcidArray[i], function(err, targetConnectionObj){
                                if (err) {
                                    return;
                                }

                                // Do we limit by group? If not the message goes out to all in room
                                if(msg.targetGroup) {
                                    targetConnectionObj.isInGroup(msg.targetGroup, function(err, isAllowed){
                                        if (isAllowed) {
                                            pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, pub.util.nextToNowhere);
                                        }
                                    });
                                }
                                else {
                                    pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, pub.util.nextToNowhere);
                                }
                            });
                        }
                        asyncCallback(null);
                    }
                ],
                function(err) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"), appObj);
                    }
                    else {
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);                    }
                });

            }

            else if (msg.targetGroup) {
                // Relay a message to one or more clients in a group
                var targetGroupObj = null;

                var outgoingMsg = {
                    senderEasyrtcid: connectionObj.getEasyrtcid(),
                    targetGroup: msg.targetGroup,
                    msgType: msg.msgType,
                    msgData: msg.msgData
                };

                async.waterfall([
                    function(asyncCallback){
                        // get group object
                        connectionObj.getApp().group(msg.targetGroup, asyncCallback);
                    },

                    function(newTargetGroupObj, asyncCallback) {
                        targetGroupObj = newTargetGroupObj;

                        // get list of connections in the group
                        targetGroupObj.getConnections(asyncCallback);
                    },

                    function(connectedEasyrtcidArray, asyncCallback) {
                        for (var i = 0; i < connectedEasyrtcidArray.length; i++) {
                            // Stop client from sending message to themselves
                            if (connectedEasyrtcidArray[i] == connectionObj.getEasyrtcid()) {
                                continue;
                            }

                            connectionObj.getApp().connection(connectedEasyrtcidArray[i], function(err, targetConnectionObj){
                                if (err) {
                                    return;
                                }
                                pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, pub.util.nextToNowhere);
                            });
                        }
                        asyncCallback(null);
                    }
                ],
                function(err) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"), appObj);
                    }
                    else {
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);
                    }
                });

            }
            else {
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received without targetEasyrtcid or targetRoom", msg);
                next(null);
            }
        }
    ],
    function(err) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
            pub.util.logError("["+connectionObj.getEasyrtcid()+"] General message error. Message ignored.", err);
        }
    });
};


/**
 * Default listener for event "emitEasyrtcCmd". This event is fired when the server should emit an EasyRTC command to a client.
 * 
 * The easyrtcid and serverTime fields will be added to the msg automatically.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {String} msgType        Message type of the message.
 * @param       {Object} msg            Message object which contains the full message to a client; this can include the standard msgData field.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitEasyrtcCmd = function(connectionObj, msgType, msg, socketCallback, next){
    if (!_.isObject(connectionObj)){
        next(new pub.util.ConnectionError("Connection object invalid. Client may have disconnected."));
        return;
    }

    var easyrtcid = connectionObj.getEasyrtcid();
    var appName = connectionObj.getAppName();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitEasyrtcCmd' with msgType ["+msgType+"]");
    if (!msg) {
        msg = {};
    }
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            if (_.isObject(returnMsg) && _.isString(returnMsg.msgType) && returnMsg.msgType == "ack"){
                // pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled Ack return message.");
            }
            else {
                pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled return message.", returnMsg);
            }
        };
    }

    msg.easyrtcid   = connectionObj.getEasyrtcid();
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit( "easyrtcCmd", msg, socketCallback);

    if (pub.getOption("logMessagesEnable")) {
        try {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Sending socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Sending socket.io message");
        }
    }

    next(null);
};


/**
 * Default listener for event "emitEasyrtcMsg". This event is fired when the server should emit an EasyRTC message to a client.
 * 
 * The easyrtcid and serverTime fields will be added to the msg automatically.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {String} msgType        Message type of the message.
 * @param       {Object} msg            Message object which contains the full message to a client; this can include the standard msgData field.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitEasyrtcMsg = function(connectionObj, msgType, msg, socketCallback, next){
    if (!_.isObject(connectionObj)){
        next(new pub.util.ConnectionError("Connection object invalid. Client may have disconnected."));
        return;
    }

    var easyrtcid = connectionObj.getEasyrtcid();
    var appName = connectionObj.getAppName();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitEasyrtcMsg' with msgType ["+msgType+"]");


    if (!msg) {
        msg = {};
    }
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            if (_.isObject(returnMsg) && _.isString(returnMsg.msgType) && returnMsg.msgType == "ack"){
                // pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled Ack return message.");
            }
            else {
                pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled return message.", returnMsg);
            }
        };
    }
    msg.easyrtcid   = connectionObj.getEasyrtcid();
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit( "easyrtcMsg", msg, socketCallback);

    if (pub.getOption("logMessagesEnable")) {
        try {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Sending socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Sending socket.io message");
        }
    }

    next(null);
};


/**
 * Default listener for event "emitError". This event is fired when the server should emit an EasyRTC error to a client.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitError = function(connectionObj, errorCode, socketCallback, next){
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitError'");
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    pub.events.emit("emitEasyrtcCmd", connectionObj, "error", pub.util.getErrorMsg(errorCode), socketCallback, next);
};


/**
 * Default listener for event "emitReturnAck". This event is fired when the server should return an Ack to a client via an acknowledgment message.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitReturnAck = function(connectionObj, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitReturnAck'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC: unable to return ack to socket.");
        return;
    }
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    var msg = {
        msgType: "ack",
        msgData:{}
    };

    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, msg, appObj);

    next(null);
};


/**
 * Default listener for event "emitReturnError". This event is fired when the server should return an Error to a client via an acknowledgment message.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitReturnError = function(connectionObj, socketCallback, errorCode, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitReturnError'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC: unable to return error to socket. Error code was [" + errorCode + "]");

        next(new pub.util.ConnectionError("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Unable to return error to socket. Error code was [" + errorCode + "]"));
        return;
    }
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    var msg = pub.util.getErrorMsg(errorCode);

    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, msg, appObj);

    next(null);
};


/**
 * Default listener for event "emitReturnToken". This event is fired when the server should return a token to a client via an acknowledgment message.
 * 
 * This is done after a client has been authenticated and the connection has been established.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitReturnToken = function(connectionObj, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onSendToken'");

    var tokenMsg = {
        msgType: "token",
        msgData:{}
    };

    // Ensure socketCallback is present
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC onSendToken called with no socketCallback.");
        try{connectionObj.socket.disconnect();}catch(e){}
        return;
    }

    async.waterfall([
        function(asyncCallback){
            // Get rooms user is in along with list
            connectionObj.generateRoomClientList("join", null, asyncCallback);
        },
        function(roomData, asyncCallback) {
            // Set roomData
            tokenMsg.msgData.roomData = roomData;

            // Retrieve ice config
            connectionObj.events.emit("getIceConfig", connectionObj, asyncCallback);
        },

        function(iceServers, asyncCallback) {
            tokenMsg.msgData.application        = {applicationName:connectionObj.getAppName()};
            tokenMsg.msgData.easyrtcid          = connectionObj.getEasyrtcid();
            tokenMsg.msgData.iceConfig          = {iceServers: iceServers};
            tokenMsg.msgData.serverTime         = Date.now();

            easyrtcid = tokenMsg.msgData.easyrtcid;

            // Get Application fields
            appObj.getFields(true, asyncCallback);
        },

        function(fieldObj, asyncCallback) {
            if (!_.isEmpty(fieldObj)){
                tokenMsg.msgData.application.field = fieldObj;
            }

            // Get Connection fields
            connectionObj.getFields(true, asyncCallback);
        },

        function(fieldObj, asyncCallback) {
            if (!_.isEmpty(fieldObj)){
                tokenMsg.msgData.field = fieldObj;
            }

            // get session object
            connectionObj.getSessionObj(asyncCallback);
        },

        function(sessionObj, asyncCallback) {
            if (sessionObj) {
                tokenMsg.msgData.sessionData = {"easyrtcsid":sessionObj.getEasyrtcsid()};

                // Get session fields
                sessionObj.getFields(true, asyncCallback);
            }
            else {
                asyncCallback(null, null);
            }
        },

        function(fieldObj, asyncCallback) {
            // Set session field (if present)
            if (fieldObj && !_.isEmpty(fieldObj)){
                tokenMsg.msgData.sessionData.field = fieldObj;
            }

            // Emit token back to socket (SUCCESS!)
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, tokenMsg, appObj);

            asyncCallback(null);
        }

    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        if (err){
            next(err);
        } else {
            next(null);
        }
    });
};


/**
 * Default listener for event "log". This event is fired when ever a loggable item is observed.
 * 
 * @param       {string} level          Log severity level. Can be ("debug"|"info"|"warning"|"error")
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 * @param       {?nextCallback} next    A success callback of form next(err).
 */
eventListener.onLog = function(level, logText, logFields, next) {
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    var consoleText = "";

    var currentDate = new Date();
    if (pub.getOption("logColorEnable")) {
        var colors = require("colors");
        if(pub.getOption("logDateEnable")) {
            consoleText += currentDate.toISOString().grey + " - ";
        }
        switch (level) {
            case "debug":
                consoleText += "debug  ".bold.blue;
                break;
            case "info":
                consoleText += "info   ".bold.green;
                break;
            case "warning":
                consoleText += "warning".bold.yellow;
                break;
            case "error":
                consoleText += "error  ".bold.red;
                break;
            default:
                consoleText += level.bold;
        }
        consoleText += " - " + "EasyRTC: ".bold + logText;
    }
    else {
        if(pub.getOption("logDateEnable")) {
            consoleText += currentDate.toISOString() + " - ";
        }
        consoleText += level;
        consoleText += " - " + "EasyRTC: " + logText;
    }

    if (logFields != undefined && logFields != null) {
        if (pub.getOption("logErrorStackEnable") && pub.util.isError(logFields)) {
            console.log(consoleText, ((pub.getOption("logColorEnable"))? "\nStack Trace:\n------------\n".bold + logFields.stack.magenta + "\n------------".bold : "\nStack Trace:\n------------\n" + logFields.stack + "\n------------"));
        }
        else if (pub.getOption("logWarningStackEnable") && pub.util.isWarning(logFields)) {
            console.log(consoleText, ((pub.getOption("logColorEnable"))? "\nStack Trace:\n------------\n".bold + logFields.stack.cyan + "\n------------".bold : "\nStack Trace:\n------------\n" + logFields.stack + "\n------------"));
        }
        else {
            console.log(consoleText, util.inspect(logFields, {colors:pub.getOption("logColorEnable"), showHidden:false, depth:pub.getOption("logObjectDepth")}));
        }
    } else {
        console.log(consoleText);
    }
    next(null);
};


/**
 * Default listener for event "msgTypeRoomJoin". This event is fired when an easyrtcCmd message with msgType of "roomJoin" is received from a client. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} rooms          A room object containing a map of room names and room parameters.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeRoomJoin = function(connectionObj, rooms, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeRoomJoin'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled socket message callback.");
        return;
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    if(!_.isObject(rooms) || _.isEmpty(rooms)) {
        pub.events.emit("emitReturnError", socketCallback, "MSG_REJECT_BAD_STRUCTURE", pub.util.nextToNowhere);
        return;
    }

    for (var currentRoomName in rooms) {
        if (!_.isString(currentRoomName) || !connectionObj.getApp().getOption("roomNameRegExp").test(currentRoomName)) {
            pub.events.emit("emitReturnError", socketCallback, "MSG_REJECT_TARGET_ROOM", pub.util.nextToNowhere);
            return;
        }
    }

    async.each(Object.keys(rooms), function(currentRoomName, roomCallback) {
        appObj.isRoom(currentRoomName, function(err, isRoom){

            // Set roomParameter map. This may be used by custom listeners.
            var currentRoomParameter;
            if (rooms[currentRoomName] && _.isObject(rooms[currentRoomName].roomParameter)){
                currentRoomParameter = rooms[currentRoomName].roomParameter;
            }

            if (isRoom) {
                pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
            }
            else if (appObj.getOption("roomAutoCreateEnable")) {
                pub.events.emit("roomCreate", appObj, connectionObj, currentRoomName, currentRoomParameter, function(err, roomObj){
                    if (err) {
                        roomCallback(err);
                        return;
                    }
                    pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
                });
            }
            else {
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"]["+currentRoomName+"] Unable to join non-existent room.");
                roomCallback(new pub.util.ConnectionError("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"]["+currentRoomName+"] Unable to join room."));
            }
        });
    }, function(err, newRoomObj) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_ROOM"), appObj);
            next(null); // Error has been handled
            return;
        }

        connectionObj.generateRoomClientList("join", rooms, function(err, roomData){
            if (err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_ROOM"), appObj);
                next(null); // Error has been handled
            }
            else {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomData", "msgData":{"roomData":roomData}}, appObj);
            }
        });
    });
};


/**
 * Default listener for event "msgTypeRoomLeave". This event is fired when an easyrtcCmd message with msgType of "roomLeave" is received from a client. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} rooms          A room object containing a map of room names.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeRoomLeave = function(connectionObj, rooms, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeRoomLeave' with rooms: ",rooms);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    // Loop through each room in the rooms object. Emit the leaveRoom event for each one.
    async.each(Object.keys(rooms), function(currentRoomName, asyncCallback) {
        connectionObj.events.emit("roomLeave", connectionObj, currentRoomName, function(err){
            if (err) {
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Error leaving room ["+currentRoomName+"].", err);
            }
            asyncCallback(null);
        });
    }, function(err, newRoomObj) {
        var roomData = {};
        for (var currentRoomName in rooms) {
            roomData[currentRoomName]={
                "roomName":     currentRoomName,
                "roomStatus":   "leave"
            };
        }
        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomData", "msgData":{"roomData":roomData}}, appObj);
        next(null);
    });
};


/**
 * Default listener for event "msgTypeGetIceConfig". This event is fired when an easyrtcCmd message with msgType of "getIceConfig" is received from a client. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeGetIceConfig = function(connectionObj, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeGetIceConfig'");

    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.events.emit("getIceConfig", connectionObj, function(err, iceConfigObj){
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
        }
        else {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"iceConfig", "msgData":{"iceConfig":{"iceServers":iceConfigObj}}}, appObj);
        }
        next(null);
    });
};


/**
 * Default listener for event "msgTypeGetRoomList". This event is fired when an easyrtcCmd message with msgType of "getRoomList" is received from a client. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeGetRoomList = function(connectionObj, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeGetRoomList'");

    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.generateRoomList(
        function(err, roomList) {
            if(err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_NO_ROOM_LIST"), appObj);
            }
            else {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomList", "msgData":{"roomList":roomList}}, appObj);
            }
            next(null);
        }
    );
};


/**
 * Default listener for event "msgTypeSetPresence". This event is fired when an easyrtcCmd message with msgType of "setPresence" is received from a client. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} presenceObj    Presence object which contains all the fields for setting a presence for a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeSetPresence = function(connectionObj, presenceObj, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeSetPresence' with setPresence: ",presenceObj);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.setPresence(
        presenceObj,
        function(err){
            if (err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_PRESENCE"), appObj);
            }
            else {
                connectionObj.emitRoomDataDelta(false, function(err, roomDataObj){
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_PRESENCE"), appObj);
                    }
                    else {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomData", "msgData":{"roomData":roomDataObj}}, appObj);
                    }
                });
            }
            next(null);
        }
    );
};


/**
 * Default listener for event "msgTypeSetRoomApiField". This event is fired when an easyrtcCmd message with msgType of "setRoomApiField" is received from a client. 
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} roomApiFieldObj Api Field object which contains all the fields for setting a presence for a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeSetRoomApiField = function(connectionObj, roomApiFieldObj, socketCallback, next){
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeSetRoomApiField' with apiFieldObj: ",roomApiFieldObj);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.room(roomApiFieldObj.roomName, function(err, connectionRoomObj){
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_ROOM"), appObj);
            next(null);
            return;
        }
        connectionRoomObj.setApiField(roomApiFieldObj.field, function(err){
            if (err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_FIELD"), appObj);
                next(null);
                return;
            }
            connectionRoomObj.emitRoomDataDelta(false, function(err, roomDataDelta){
                if (err) {
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
                    next(null);
                    return;
                }

                var msg = {"msgType":"roomData", "msgData": {"roomData": {}}};
                msg.msgData.roomData[roomApiFieldObj.roomName] = roomDataDelta;
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, msg, appObj);
            });
        });
    });
};


/**
 * Default listener for event "getIceConfig". Returns an ICE configuration object to the callback.
 * 
 * The ICE configuration object will hold the array of STUN and TURN servers the connection should use when forming a peer connection. This default listener uses the "appIceServers" configuration option at the application level.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} callback     Callback of form (err, iceConfigArray)
 */
eventListener.onGetIceConfig = function(connectionObj, callback){
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onGetIceConfig'");
    callback(null, connectionObj.getApp().getOption("appIceServers"));
};


/**
 * Default listener for event "roomCreate". Creates a room attached to an application with a specified room name. The optional creatorConnectionObj is provided to provide context; joining the room is done separately. If successful, the callback returns a roomObj.
 * 
 * @param       {Object} appObj         EasyRTC application object. Contains methods used for identifying and managing an application.
 * @param       {?Object} creatorConnectionObj EasyRTC connection object belonging to the creator of the room. Contains methods used for identifying and managing a connection.
 * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
 * @param       {?Object} roomOptions   Sets room level options. May be null or map of key/value pairs.
 * @param       {Function} callback     Callback of form (err, roomObj)
 */
eventListener.onRoomCreate = function(appObj, creatorConnectionObj, roomName, roomOptions, callback){
    pub.util.logDebug("["+appObj.getAppName()+"]" + (creatorConnectionObj?"["+creatorConnectionObj.getEasyrtcid()+"]":"") +  " Room ["+ roomName +"] Running func 'onRoomCreate'");
    appObj.createRoom(roomName, roomOptions, callback);
};


/**
 * Default listener for event "roomJoin". Joins a connection to a a specified room. If successful, the callback will return a connectionRoomObj.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
 * @param       {?Object} roomParameter A map(dictionary) object with key/value pairs. The values can be any JSONable object. This field is not currently looked at by EasyRTC, however it is available for custom server applications. May be used for room options or authentication needs.
 * @param       {Function} callback     Callback of form (err, connectionRoomObj)
 */
eventListener.onRoomJoin = function(connectionObj, roomName, roomParameter, callback){
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onRoomJoin'");

    // roomParameter is a new field. To ease upgrading we'll just show a warning to server applications which haven't updated 
    if (_.isFunction(roomParameter)){
        pub.util.logWarning("Upgrade notice: EasyRTC roomJoin event called without roomParameter object.");
        callback = roomParameter;
        roomParameter = null;
    }

    connectionObj.joinRoom(roomName, function(err, connectionRoomObj){
        if (err) {
            callback(err);
            return;
        }
        connectionRoomObj.emitRoomDataDelta(false, function(err, roomDataDelta){
            // Return connectionRoomObj regardless of if there was a problem sending out the deltas
            callback(null, connectionRoomObj);
        });
    });
};


/**
 * Default listener for event "roomLeave". Run upon a connection leaving a room.
 * 
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onRoomLeave = function(connectionObj, roomName, next){
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onRoomLeave' with rooms ["+roomName+"]");

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.room(roomName, function(err, connectionRoomObj){
        if (err) {
            pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Couldn't leave room [" + roomName + "]");
            next(err);
            return;
        }

        pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Leave room [" + roomName + "]");
        connectionRoomObj.leaveRoom(next);
    });
};


/**
 * Default listener for event "shutdown". This event is fired when the server is being shutdown.
 * 
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onShutdown = function(next){
    pub.util.logDebug("Running func 'onShutdown'");
    next(null);
};


/**
 * Default listener for event "startup". This event initializes EasyRTC server so it is ready for connections.
 *
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onStartup = function(next){
    if (!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    pub.util.logDebug("Running func 'onStartup'");
    async.waterfall([
        function(callback) {
            pub.util.logDebug("Configuring Http server");

            // Set the EasyRTC demos
            if (pub.getOption("demosEnable")) {
                pub.util.logDebug("Setting up demos to be accessed from '" + pub.getOption("demosPublicFolder") + "/'");
                pub.httpApp.get(pub.getOption("demosPublicFolder") + "/*", function(req, res) {
                    (res.sendFile||res.sendfile).call(res,
                        "./demos/" + (req.params[0] ? req.params[0] : "index.html"),
                        {root:__dirname + "/../"},
                        function(err) {
                            try{if (err && err.status && res && !res._headerSent) {
                                res.status(404);
                                var body =    "<html><head><title>File Not Found</title></head><body><h1>File Not Found</h1></body></html>";
                                res.setHeader("Content-Type", "text/html");
                                res.setHeader("Content-Length", body.length);
                                res.end(body);
                            }}catch(e){}
                        }
                    );
                });
                // Forward people who forget the trailing slash to the folder.
                pub.httpApp.get(pub.getOption("demosPublicFolder"), function(req, res) {res.redirect(pub.getOption("demosPublicFolder") + "/");});
            }

            if (pub.getOption("apiEnable")) {
                // Set the EasyRTC API files
                pub.util.logDebug("Setting up API files to be accessed from '" + pub.getOption("apiPublicFolder") + "/'");
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.js",                  function(req, res) {pub.util.sendSessionCookie(req, res); (res.sendFile||res.sendfile).call(res,"api/easyrtc.js",                   {root:__dirname + "/../"});});
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc_ft.js",               function(req, res) {pub.util.sendSessionCookie(req, res); (res.sendFile||res.sendfile).call(res,"api/easyrtc_ft.js",                {root:__dirname + "/../"});});
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.css",                 function(req, res) {pub.util.sendSessionCookie(req, res); (res.sendFile||res.sendfile).call(res,"api/easyrtc.css",                  {root:__dirname + "/../"});});
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.min.js",              function(req, res) {pub.util.sendSessionCookie(req, res); (res.sendFile||res.sendfile).call(res,"open_source/api/easyrtc.min.js",   {root:__dirname + "/../"});});
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc_ft.min.js",           function(req, res) {pub.util.sendSessionCookie(req, res); (res.sendFile||res.sendfile).call(res,"api/easyrtc_ft.min.js",            {root:__dirname + "/../"});});
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.min.css",             function(req, res) {pub.util.sendSessionCookie(req, res); (res.sendFile||res.sendfile).call(res,"open_source/api/easyrtc.min.css",  {root:__dirname + "/../"});});
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/img/*", function(req, res) {
                    pub.util.sendSessionCookie(req, res); 
                    (res.sendFile||res.sendfile).call(res,
                        "./api/img/" + (req.params[0] ? req.params[0] : "index.html"),
                        {root:__dirname + "/../"},
                        function(err) {
                            try{if (err && err.status && res && !res._headerSent) {
                                res.status(404);
                                var body =    "<html><head><title>File Not Found</title></head><body><h1>File Not Found</h1></body></html>";
                                res.setHeader("Content-Type", "text/html");
                                res.setHeader("Content-Length", body.length);
                                res.end(body);
                            }}catch(e){}
                        }
                    );
                });
                if(pub.getOption("apiLabsEnable")){
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/labs/*", function(req, res) {
                        pub.util.sendSessionCookie(req, res);
                        (res.sendFile||res.sendfile).call(res,
                                "./api/labs/" + (req.params[0] ? req.params[0] : "index.html"),
                            {root:__dirname + "/../"},
                            function(err) {
                                try{if (err && err.status && res && !res._headerSent) {
                                    res.status(404);
                                    var body =    "<html><head><title>File Not Found</title></head><body><h1>File Not Found</h1></body></html>";
                                    res.setHeader("Content-Type", "text/html");
                                    res.setHeader("Content-Length", body.length);
                                    res.end(body);
                                }}catch(e){}
                            }
                        );
                    });
                }
            }

            if (pub.getOption("apiEnable") && pub.getOption("apiOldLocationEnable")) {
                pub.util.logWarning("Enabling listening for API files in older depreciated location.");
                // Transition - Old locations of EasyRTC API files
                pub.httpApp.get("/js/easyrtc.js",                   function(req, res) {(res.sendFile||res.sendfile).call(res,"api/easyrtc.js",              {root:__dirname + "/../"});});
                pub.httpApp.get("/css/easyrtc.css",                 function(req, res) {(res.sendFile||res.sendfile).call(res,"api/easyrtc.css",             {root:__dirname + "/../"});});
            }
            callback(null);
        },

        function(callback) {
            pub.util.logDebug("Configuring Socket server");

            pub.socketServer.sockets.on("connection", function (socket) {
                var easyrtcid = socket.id;

                pub.util.logDebug("["+easyrtcid+"] Socket connected");
                pub.util.logDebug("Emitting event 'connection'");
                pub.events.emit("connection", socket, easyrtcid, function(err){
                    if(err){
                        socket.disconnect();
                        pub.util.logError("["+easyrtcid+"] Connect error", err);
                    }
                });
            });
            callback(null);
        },

        // Setup default application
        function(callback) {
            pub.createApp(pub.getOption("appDefaultName"), null, callback);
        },

        function(appObj, callback) {
            // Checks to see if there is a newer version of EasyRTC available
            if (pub.getOption("updateCheckEnable")) {
                pub.util.updateCheck();
            }
            callback(null);
        }
    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        next(err);
    });
};

}).call(this,"/node_modules/easyrtc/lib")
},{"./easyrtc_public_obj":5,"./general_util":8,"async":9,"colors":14,"underscore":21,"util":61}],3:[function(require,module,exports){
/**
 * @file        Default options used within EasyRTC. Overriding of default options should be done using the public listen() or setOption() functions.
 * @module      easyrtc_default_options
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var option = {};

// Application Options
option.appDefaultName       = "default";                    // The default application a connection belongs to if it is not initially specified.
option.appAutoCreateEnable  = true;                         // Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.
option.appDefaultFieldObj   = null;                         // Default fields which are set when an application is created. In form of {"fieldName":{fieldValue:<JsonObj>, fieldOption:{isShared:<boolean>}}[, ...]}
option.appIceServers = [                                    // Array of STUN and TURN servers. By default there is only publicly available STUN servers.
    {url: "stun:stun.l.google.com:19302"},
    {url: "stun:stun.sipgate.net"},
    {url: "stun:217.10.68.152"},
    {url: "stun:stun.sipgate.net:10000"},
    {url: "stun:217.10.68.152:10000"}
];


// Room Options
option.roomDefaultEnable    = true;                         // Enables connections joining a default room if it is not initially specified. If false, than a connection initially may be in no room.
option.roomDefaultName      = "default";                    // The default room a connection joins if it is not initially specified.
option.roomAutoCreateEnable = true;                         // Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.
option.roomDefaultFieldObj  = null;                         // Default fields which are set when a room is created. In form of {"fieldName":{fieldValue:<JsonObj>, fieldOption:{isShared:<boolean>}}[, ...]}


// Connection Options
option.connectionDefaultFieldObj  = null;                   // Default fields which are set when a connection is created. In form of {"fieldName":{fieldValue:<JsonObj>, fieldOption:{isShared:<boolean>}}[, ...]}


// SessionOptions
option.sessionEnable        = true;                         // Enable sessions. If sessions are disabled, each socket connection from the same user will be the same. Relies on Express session handling also being enabled.
option.sessionCookieEnable  = true;                         // If enabled, the server will attempt to send a easyrtcsid cookie which matches the Express session id.


// API Hosting Options
option.apiEnable            = true;                         // Enables hosting of the EasyRTC API files.
option.apiPublicFolder      = "/easyrtc";                   // Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'
option.apiLabsEnable        = true;                         // Enables hosting of the EasyRTC experimental API files located in the 'labs' sub folder
option.apiOldLocationEnable = false;                        // [Depreciated] Listens for requests to core API files in old locations (in addition to the new standard locations)


// Demo Options
option.demosEnable          = true;
option.demosPublicFolder    = "/demos";                     // Demos public folder without trailing slash. This sets the public URL where where demos are hosted, such as http://yourdomain/demos/


// Log options - Only apply if internal 'log' event is used
option.logLevel             = "info";                       // The minimum log level to show. (debug|info|warning|error|none)
option.logDateEnable        = false;                        // Display timestamp in each entry
option.logErrorStackEnable  = true;                         // print the stack trace in logged errors when available
option.logWarningStackEnable= true;                         // print the stack trace in logged warnings when available
option.logColorEnable       = true;                         // include console colors. Disable if forwarding logs to files or databases
option.logObjectDepth       = 7;                            // When objects are included in the log, this is the max depth the log will display
option.logMessagesEnable    = false;                        // Log the full contents of incoming and outgoing messages. Also requires the logLevel to be set at "debug". Introduces security and performance concerns.

// Miscellaneous Server Options
option.updateCheckEnable    = true;                         // Checks for updates


// Regular expressions for validating names and other input
option.apiVersionRegExp     = /^[a-z0-9_.+-]{1,32}$/i;      // API Version
option.appNameRegExp        = /^[a-z0-9_.-]{1,32}$/i;       // Application name
option.easyrtcidRegExp      = /^[a-z0-9_.-]{1,32}$/i;       // EasyRTC socket id (easyrtcid)
option.easyrtcsidRegExp     = /^[a-z0-9_.-]{1,64}$/i;       // EasyRTC session id (easyrtcsid)
option.groupNameRegExp      = /^[a-z0-9_.-]{1,32}$/i;       // Group name
option.fieldNameRegExp      = /^[a-z0-9_. -]{1,32}$/i;      // Field names (for defining app and room custom fields)
option.optionNameRegExp     = /^[a-z0-9_. -]{1,32}$/i;      // Option names (for defining server options)
option.presenceShowRegExp   = /^(away|chat|dnd|xa)$/;       // Allowed presence "show" values (for setPresence command)
option.presenceStatusRegExp = /^(.){0,255}$/;               // Allowed presence "status" value
option.roomNameRegExp       = /^[a-z0-9_.-]{1,32}$/i;       // Room name
option.usernameRegExp       = /^(.){1,64}$/i;               // Username


// Allows the option object to be seen by the caller.
module.exports = option;
},{}],4:[function(require,module,exports){
/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// var _               = require("underscore");                // General utility functions external module
var defaultOptions  = require("./easyrtc_default_options"); // EasyRTC global variable
var g               = require("./general_util");            // General utility functions local module

var e = {};

e.version           = g.getPackageData("version");
e.serverStartOn     = Date.now();
e.option            = g.deepCopy(defaultOptions);
e.app               = {};

module.exports = e;

},{"./easyrtc_default_options":3,"./general_util":8}],5:[function(require,module,exports){
(function (process){
/**
 * Public interface for interacting with EasyRTC. Contains the public object returned by the EasyRTC listen() function.
 *
 * @module      easyrtc_public_obj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var events = require("events");
var async = require("async");
var _ = require("underscore");                // General utility functions external module
var g = require("./general_util");            // General utility functions local module

var e = require("./easyrtc_private_obj");     // EasyRTC private object
var eventListener = require("./easyrtc_default_event_listeners"); // EasyRTC default event listeners
var eu = require("./easyrtc_util");            // EasyRTC utility functions

/**
 * The public object which is returned by the EasyRTC listen() function. Contains all public methods for interacting with EasyRTC server.
 *
 * @class
 */
var pub = module.exports;


/**
 * Alias for Socket.io server object. Set during Listen().
 *
 * @member  {Object}    pub.socketServer
 * @example             <caption>Dump of all Socket.IO clients to server console</caption>
 * console.log(pub.socketServer.connected);
 */
pub.socketServer = null;


/**
 * Alias for Express app object. Set during Listen()
 *
 * @member  {Object}    pub.httpApp
 */
pub.httpApp = null;


/**
 * Sends an array of all application names to a callback.
 *
 * @param   {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
 */
pub.getAppNames = function(callback) {
    var appNames = [];
    for (var key in e.app) {
        appNames.push(key);
    }
    callback(null, appNames);
};


/**
 * Gets app object for application which has an authenticated client with a given easyrtcid
 *
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {function(?Error, Object=)} callback Callback with error and application object
 */
pub.getAppWithEasyrtcid = function(easyrtcid, callback) {
    for (var key in e.app) {
        if (e.app[key].connection[easyrtcid] && e.app[key].connection[easyrtcid].isAuthenticated) {
            pub.app(key, callback);
            return;
        }
    }
    pub.util.logWarning("Can not find connection [" + easyrtcid + "]");
    callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "]"));
};


/**
 * Sends the count of the number of connections to the server to a provided callback.
 *
 * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
 */
pub.getConnectionCount = function(callback) {
    callback(null, pub.getConnectionCountSync());
};


/**
 * Sends the count of the number of connections to the server to a provided callback.
 *
 * @returns     {Number} The current number of connections in a room.
 */
pub.getConnectionCountSync = function() {
    var connectionCount = 0;
    for (var key in e.app) {
        connectionCount = connectionCount + _.size(e.app[key].connection);
    }
    return connectionCount;
};


/**
 * Gets connection object for connection which has an authenticated client with a given easyrtcid
 *
 * @param       {string} easyrtcid      EasyRTC unique identifier for a socket connection.
 * @param       {function(?Error, Object=)} callback Callback with error and connection object
 */
pub.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
    for (var key in e.app) {
        if (e.app[key].connection[easyrtcid] && e.app[key].connection[easyrtcid].isAuthenticated) {
            pub.app(key, function(err, appObj) {
                if (err) {
                    callback(err);
                    return;
                }
                appObj.connection(easyrtcid, callback);
            });
            return;
        }
    }
    pub.util.logWarning("Can not find connection [" + easyrtcid + "]");
    callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "]"));
};


/**
 * Gets individual option value. The option value returned is for the server level.
 * 
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {String}    optionName  Option name
 * @return      {*}                     Option value (can be any JSON type)
 */
pub.getOption = function(optionName) {
    if(typeof e.option[optionName] === "undefined"){
        pub.util.logError("Unknown option requested. Unrecognised option name '" + optionName + "'.");
        return null;
    }
    return e.option[optionName];
};


/**
 * Gets EasyRTC Version. The format is in a major.minor.patch format with an optional letter following denoting alpha or beta status. The version is retrieved from the package.json file located in the EasyRTC project root folder.
 *
 * @return      {string}                EasyRTC Version
 */
pub.getVersion = function() {
    return e.version;
};


/**
 * Returns the EasyRTC private object containing the current state. This should only be used for debugging purposes.
 *
 * @private
 * @return      {Object}                EasyRTC private object
 */
pub._getPrivateObj = function() {
    return e;
};


/**
 * Sets individual option. The option value set is for the server level.
 * 
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {Object} optionName     Option name
 * @param       {Object} optionValue    Option value
 * @return      {Boolean}               true on success, false on failure
 */
pub.setOption = function(optionName, optionValue) {
    // Can only set options which currently exist
    if (typeof e.option[optionName] == "undefined") {
        pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
        return false;
    }

    e.option[optionName] = pub.util.deepCopy(optionValue);
    return true;
};


/**
 * EasyRTC Event handling object which contain most methods for interacting with EasyRTC events. For convenience, this class has also been attached to the application, connection, session, and room classes.
 * @class
 */
pub.events = {};


/**
 * EasyRTC EventEmitter.
 * 
 * @private
 */
pub.events._eventListener = new events.EventEmitter();


/**
 * Expose event listener's emit function.
 * 
 * @param       {string} eventName      EasyRTC event name.
 * @param       {...*} eventParam       The event parameters
 */
pub.events.emit = pub.events._eventListener.emit.bind(pub.events._eventListener);


/**
 * Runs the default EasyRTC listener for a given event.
 * 
 * @param       {string} eventName      EasyRTC event name.
 * @param       {...*} eventParam       The event parameters
 */
pub.events.emitDefault = function() {
    if (!pub.events.defaultListeners[arguments['0']]) {
        console.error("Error emitting listener. No default for event '" + arguments['0'] + "' exists.");
        return;
    }
    pub.events.defaultListeners[Array.prototype.shift.call(arguments)].apply(this, arguments);
};


/**
 * Resets the listener for a given event to the default listener. Removes other listeners.
 *
 * @param       {string} eventName      EasyRTC event name.
 */
pub.events.setDefaultListener = function(eventName) {
    if (!_.isFunction(pub.events.defaultListeners[eventName])) {
        console.error("Error setting default listener. No default for event '" + eventName + "' exists.");
    }
    pub.events._eventListener.removeAllListeners(eventName);
    pub.events._eventListener.on(eventName, pub.events.defaultListeners[eventName]);
};


/**
 * Resets the listener for all EasyRTC events to the default listeners. Removes all other listeners.
 */
pub.events.setDefaultListeners = function() {
    pub.events._eventListener.removeAllListeners();
    for (var currentEventName in pub.events.defaultListeners) {
        if (_.isFunction(pub.events.defaultListeners[currentEventName])) {
            pub.events._eventListener.on(currentEventName, pub.events.defaultListeners[currentEventName]);
        } else {
            throw new pub.util.ServerError("Error setting default listener. No default for event '" + currentEventName + "' exists.");
        }
    }
};


/**
 * Map of EasyRTC event listener names to their default functions. This map can be used to run a default function manually.
 */
pub.events.defaultListeners = {
    "authenticate": eventListener.onAuthenticate,
    "authenticated": eventListener.onAuthenticated,
    "connection": eventListener.onConnection,
    "disconnect": eventListener.onDisconnect,
    "getIceConfig": eventListener.onGetIceConfig,
    "roomCreate": eventListener.onRoomCreate,
    "roomJoin": eventListener.onRoomJoin,
    "roomLeave": eventListener.onRoomLeave,
    "log": eventListener.onLog,
    "shutdown": eventListener.onShutdown,
    "startup": eventListener.onStartup,
    "easyrtcAuth": eventListener.onEasyrtcAuth,
    "easyrtcCmd": eventListener.onEasyrtcCmd,
    "easyrtcMsg": eventListener.onEasyrtcMsg,
    "emitEasyrtcCmd": eventListener.onEmitEasyrtcCmd,
    "emitEasyrtcMsg": eventListener.onEmitEasyrtcMsg,
    "emitError": eventListener.onEmitError,
    "emitReturnAck": eventListener.onEmitReturnAck,
    "emitReturnError": eventListener.onEmitReturnError,
    "emitReturnToken": eventListener.onEmitReturnToken,
    "msgTypeGetIceConfig": eventListener.onMsgTypeGetIceConfig,
    "msgTypeGetRoomList": eventListener.onMsgTypeGetRoomList,
    "msgTypeRoomJoin": eventListener.onMsgTypeRoomJoin,
    "msgTypeRoomLeave": eventListener.onMsgTypeRoomLeave,
    "msgTypeSetPresence": eventListener.onMsgTypeSetPresence,
    "msgTypeSetRoomApiField": eventListener.onMsgTypeSetRoomApiField
};


/**
 * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one. See the events documentation for expected listener parameters.
 *
 * @param       {string} eventName      Listener name.
 * @param       {function} listener     Function to be called when listener is fired
 */
pub.events.on = function(eventName, listener) {
    if (eventName && _.isFunction(listener)) {
        pub.events._eventListener.removeAllListeners(eventName);
        pub.events._eventListener.on(eventName, listener);
    }
    else {
        pub.util.logError("Unable to add listener to event '" + eventName + "'");
    }
};


/**
 * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added. If eventName is `null`, all events will be removed than the defaults will be restored.
 *
 * @param       {?string} eventName     Listener name. If `null`, then all events will be removed.
 */
pub.events.removeAllListeners = function(eventName) {
    if (eventName) {
        pub.events.setDefaultListener(eventName);
    } else {
        pub.events.setDefaultListeners();
    }
};


/**
 * General utility functions are grouped in this util object.  For convenience, this class has also been attached to the application, connection, session, and room classes.
 * @class
 */
pub.util = {};


/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @function
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
pub.util.deepCopy = g.deepCopy;


/**
 * An empty dummy function, which is designed to be used as a default callback in functions when none has been provided.
 *
 * @param       {Error} err             Error object
 */
pub.util.nextToNowhere = function(err) {
};

/**
 * Determines if an Error object is an instance of ApplicationError, ConnectionError, or ServerError. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
pub.util.isError = eu.isError;


/**
 * Determines if an Error object is an instance of ApplicationWarning, ConnectionWarning, or ServerWarning. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
pub.util.isWarning = eu.isWarning;


/**
 * Custom Error Object for EasyRTC Application Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ApplicationError = eu.ApplicationError;


/**
 * Custom Error Object for EasyRTC Application Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ApplicationWarning = eu.ApplicationWarning;


/**
 * Custom Error Object for EasyRTC C Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ConnectionError = eu.ConnectionError;

/**
 * Custom Error Object for EasyRTC Connection Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ConnectionWarning = eu.ConnectionWarning;


/**
 * Custom Error Object for EasyRTC Server Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ServerError = eu.ServerError;


/**
 * Custom Error Object for EasyRTC Server Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ServerWarning = eu.ServerWarning;


/**
 * Returns an EasyRTC message error object for a specific error code. This is meant to be emitted or returned to a websocket client.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {Object}                EasyRTC message error object for the specific error code.
 */
pub.util.getErrorMsg = function(errorCode) {
    var msg = {
        msgType: "error",
        serverTime: Date.now(),
        msgData: {
            errorCode: errorCode,
            errorText: pub.util.getErrorText(errorCode)
        }
    };

    if (!msg.msgData.errorText) {
        msg.msgData.errorText = "Error occurred with error code: " + errorCode;
        pub.util.logWarning("Emitted unknown error with error code [" + errorCode + "]");
    }

    return msg;
};


/**
 * Returns human readable text for a given error code. If an unknown error code is provided, a null value will be returned.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {string}                Human readable error string
 */
pub.util.getErrorText = function(errorCode) {
    switch (errorCode) {
        case "BANNED_IP_ADDR":
            return "Client IP address is banned. Socket will be disconnected.";
            break;
        case "LOGIN_APP_AUTH_FAIL":
            return "Authentication for application failed. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_APP_NAME":
            return "Provided application name is improper. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_AUTH":
            return "Authentication for application failed. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_ROOM":
            return "Requested room is invalid or does not exist. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_STRUCTURE":
            return "Authentication for application failed. The provided structure is improper. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_USER_CFG":
            return "Provided configuration options improper or invalid. Socket will be disconnected.";
            break;
        case "LOGIN_GEN_FAIL":
            return "Authentication failed. Socket will be disconnected.";
            break;
        case "LOGIN_NO_SOCKETS":
            return "No sockets available for account. Socket will be disconnected.";
            break;
        case "LOGIN_TIMEOUT":
            return "Login has timed out. Socket will be disconnected.";
            break;
        case "MSG_REJECT_BAD_DATA":
            return "Message rejected. The provided msgData is improper.";
            break;
        case "MSG_REJECT_BAD_ROOM":
            return "Message rejected. Requested room is invalid or does not exist.";
            break;
        case "MSG_REJECT_BAD_FIELD":
            return "Message rejected. Problem with field structure or name.";
            break;
        case "MSG_REJECT_BAD_SIZE":
            return "Message rejected. Packet size is too large.";
            break;
        case "MSG_REJECT_BAD_STRUCTURE":
            return "Message rejected. The provided structure is improper.";
            break;
        case "MSG_REJECT_BAD_TYPE":
            return "Message rejected. The provided msgType is unsupported.";
            break;
        case "MSG_REJECT_GEN_FAIL":
            return "Message rejected. General failure occurred.";
            break;
        case "MSG_REJECT_NO_AUTH":
            return "Message rejected. Not logged in or client not authorized.";
            break;
        case "MSG_REJECT_NO_ROOM_LIST":
            return "Message rejected. Room list unavailable.";
            break;
        case "MSG_REJECT_PRESENCE":
            return "Message rejected. Presence could could not be set.";
            break;
        case "MSG_REJECT_TARGET_EASYRTCID":
            return "Message rejected. Target easyrtcid is invalid, not using same application, or no longer online.";
            break;
        case "MSG_REJECT_TARGET_GROUP":
            return "Message rejected. Target group is invalid or not defined.";
            break;
        case "MSG_REJECT_TARGET_ROOM":
            return "Message rejected. Target room is invalid or not created.";
            break;
        case "SERVER_SHUTDOWN":
            return "Server is being shutdown. Socket will be disconnected.";
            break;
        default:
            pub.util.logWarning("Unknown message errorCode requested [" + errorCode + "]");
            return null;
    }
};


/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.option.logLevel
 *
 * @param       {string} level          Log severity level. Can be ("debug"|"info"|"warning"|"error")
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.log = function(level, logText, logFields) {
    switch (e.option.logLevel) {
        case "error":
            if (level != "error") {
                break;
            }

        case "warning":
            if (level == "info") {
                break;
            }

        case "info":
            if (level == "debug") {
                break;
            }

        case "debug":
            pub.events.emit("log", level, logText, logFields);
    }
};


/**
 * Convenience function for logging "debug" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logDebug = function(logText, logFields) {
    pub.util.log("debug", logText, logFields);
};


/**
 * Convenience function for logging "info" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logInfo = function(logText, logFields) {
    pub.util.log("info", logText, logFields);
};


/**
 * Convenience function for logging "warning" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logWarning = function(logText, logFields) {
    pub.util.log("warning", logText, logFields);
};


/**
 * Convenience function for logging "error" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logError = function(logText, logFields) {
    pub.util.log("error", logText, logFields);
};


/**
 * Sends an 'ack' socket message to a given socketCallback. Provides additional checking and logging.
 *
 * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
 * @param       {Function}  socketCallback Socket.io callback function
 * @param       {?Object}   appObj      EasyRTC application object. Contains methods used for identifying and managing an application.
 */
pub.util.sendSocketCallbackAck = function(easyrtcid, socketCallback, appObj) {
    return pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"ack"}, appObj);
};


/**
 * Sends a complete socket message to a given socketCallback. Provides additional checking and logging.
 *
 * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
 * @param       {Function}  socketCallback Socket.io callback function
 * @param       {Object}    msg         Message object which contains the full message for a client; this can include the standard msgType and msgData fields.
 * @param       {?Object}   appObj      EasyRTC application object. Contains methods used for identifying and managing an application.
 */
pub.util.sendSocketCallbackMsg = function(easyrtcid, socketCallback, msg, appObj) {
    var appName;

    if (appObj) {
        appName = appObj.getAppName();
        if (!appObj.isConnectedSync(easyrtcid)) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Unable to return socket message. Peer no longer connected.");
            return false;
        }
    }

    if (!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Provided socketCallback was not a function.");
        return false;
    }

    try {
        socketCallback(msg);
    } catch(err) {
        pub.util.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Call to socketCallback failed.");
    }

    if (e.option.logMessagesEnable) {
        try {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message");
        }
    }
    return true;
};

/**
 *  Checks with EasyRTC site for latest version. Writes to the log if a version can be found. If connection cannot be established than no error will be shown.
 */
pub.util.updateCheck = function() {
    var easyrtcVersion = pub.getVersion();

    require("http").get("http://easyrtc.com/version/?app=easyrtc&ver=" + easyrtcVersion + "&platform=" + process.platform + "&nodever=" + process.version, function(res) {
        if (res.statusCode == 200)
            res.on('data', function(latestVersion) {
                latestVersion = (latestVersion + "").replace(/[^0-9a-z.]/g, "");
                if (latestVersion != easyrtcVersion) {
                    var l = latestVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    l[0] = parseInt(l[0]);
                    l[1] = parseInt(l[1]);
                    l[2] = parseInt(l[2]);
                    var v = easyrtcVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    v[0] = parseInt(v[0]);
                    v[1] = parseInt(v[1]);
                    v[2] = parseInt(v[2]);
                    if (v[0] < l[0] || (v[0] == l[0] && v[1] < l[1]) || (v[0] == l[0] && v[1] == l[1] && v[2] < l[2]))
                        pub.util.logWarning("Update Check: New version of EasyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/ for details or run 'npm update' to upgrade.");
                    else if (v[0] == l[0] && v[1] == l[1] && v[2] == l[2] && easyrtcVersion.replace(/[^a-z]/gi, "") != "")
                        pub.util.logWarning("Update Check: New non-beta version of EasyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/ for details.");
                }
            });
    }).on('error', function(e) {
    });
};


/**
 * Checks an incoming EasyRTC message to determine if it is syntactically valid.
 *
 * @param       {string} type           The Socket.IO message type. Expected values are (easyrtcAuth|easyrtcCmd|easyrtcMsg)
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {?Object} appObj        EasyRTC application object. Contains methods used for identifying and managing an application.
 * @param       {function(?Error, boolean, string)} callback Callback with error, a boolean of whether message if valid, and a string indicating the error code if the message is invalid.
 */
pub.util.isValidIncomingMessage = function(type, msg, appObj, callback) {
    // A generic getOption variable which points to the getOption function at either the top or application level
    var getOption = (_.isObject(appObj) ? appObj.getOption : pub.getOption);

    // All messages follow the basic structure
    if (!_.isString(type)) {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }
    if (!_.isObject(msg)) {
        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
        return;
    }
    if (!_.isString(msg.msgType)) {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }

    switch (type) {
        case "easyrtcAuth":
            if (msg.msgType != "authenticate") {
                callback(null, false, "MSG_REJECT_BAD_TYPE");
                return;
            }
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }

            // msgData.apiVersion (required)
            if (msg.msgData.apiVersion === undefined || !_.isString(msg.msgData.apiVersion) || !getOption("apiVersionRegExp").test(msg.msgData.apiVersion)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            // msgData.appName
            if (msg.msgData.applicationName !== undefined && (!_.isString(msg.msgData.applicationName) || !getOption("appNameRegExp").test(msg.msgData.applicationName))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            // msgData.easyrtcsid
            if (msg.msgData.easyrtcsid !== undefined && (!_.isString(msg.msgData.easyrtcsid) || !getOption("easyrtcsidRegExp").test(msg.msgData.easyrtcsid))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            var isCallbackRun = false;
            async.waterfall([
                function(asyncCallback) {
                    if (!appObj) {
                        pub.app((msg.msgData.applicationName !== undefined ? msg.msgData.applicationName : getOption("appDefaultName")), function(err, newAppObj) {
                            if (!err) {
                                appObj = newAppObj;
                                getOption = appObj.getOption;
                            }
                            asyncCallback(null);
                        });
                    }
                    else {
                        asyncCallback(null);
                    }
                },
                function(asyncCallback) {
                    // msgData.username
                    if (msg.msgData.username !== undefined && (!_.isString(msg.msgData.username) || !getOption("usernameRegExp").test(msg.msgData.username))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        isCallbackRun = true;
                        return;
                    }

                    // msgData.credential
                    if (msg.msgData.credential !== undefined && (!_.isObject(msg.msgData.credential) || _.isEmpty(msg.msgData.credential))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        isCallbackRun = true;
                        return;
                    }

                    // msgData.roomJoin
                    if (msg.msgData.roomJoin !== undefined) {
                        if (!_.isObject(msg.msgData.roomJoin)) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }

                        for (var currentRoomName in msg.msgData.roomJoin) {
                            if (!getOption("roomNameRegExp").test(currentRoomName) || !_.isObject(msg.msgData.roomJoin[currentRoomName]) || !_.isString(msg.msgData.roomJoin[currentRoomName].roomName) || currentRoomName != msg.msgData.roomJoin[currentRoomName].roomName) {
                                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                                isCallbackRun = true;
                                return;
                            }
                            // if roomParameter field is defined, it must be an object
                            if (msg.msgData.roomJoin[currentRoomName].roomParameter !== undefined && !_.isObject(msg.msgData.roomJoin[currentRoomName].roomParameter)) {
                                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                                isCallbackRun = true;
                                return;
                            }
                        }
                    }

                    // msgData.setPresence
                    if (msg.msgData.setPresence !== undefined) {
                        if (!_.isObject(msg.msgData.setPresence) || _.isEmpty(msg.msgData.setPresence)) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }
                        if (msg.msgData.setPresence.show !== undefined && (!_.isString(msg.msgData.setPresence.show) || !getOption("presenceShowRegExp").test(msg.msgData.setPresence.show))) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }
                        if (msg.msgData.setPresence.status !== undefined && (!_.isString(msg.msgData.setPresence.status) || !getOption("presenceStatusRegExp").test(msg.msgData.setPresence.status))) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }
                    }

                    // TODO: setUserCfg
                    if (msg.msgData.setUserCfg !== undefined) {
                    }
                    asyncCallback(null);

                }
            ],
                    function(err) {
                        if (err) {
                            if (!isCallbackRun) {
                                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                                isCallbackRun = true;
                            }
                        }
                        else {
                            // Incoming message syntactically valid
                            callback(null, true, null);
                        }
                    }
            );

            return;
            break;

        case "easyrtcCmd":
            switch (msg.msgType) {
                case "candidate" :
                case "offer" :
                case "answer" :
                    // candidate, offer, and answer each require a non-empty msgData object and a proper targetEasyrtcid
                    if (!_.isObject(msg.msgData) || _.isEmpty(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isString(msg.targetEasyrtcid) || !getOption("easyrtcidRegExp").test(msg.targetEasyrtcid)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    break;
                case "reject" :
                case "hangup" :
                    // reject, and hangup each require a targetEasyrtcid but no msgData
                    if (msg.msgData !== undefined) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isString(msg.targetEasyrtcid) || !getOption("easyrtcidRegExp").test(msg.targetEasyrtcid)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    break;

                case "getIceConfig" :
                    if (msg.msgData !== undefined && !_.isEmpty(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    break;

                case "getRoomList" :
                    if (msg.msgData !== undefined) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    break;

                case "roomJoin" :
                    if (!_.isObject(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isObject(msg.msgData.roomJoin)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }

                    for (var currentRoomName in msg.msgData.roomJoin) {
                        if (!getOption("roomNameRegExp").test(currentRoomName) || !_.isObject(msg.msgData.roomJoin[currentRoomName]) || !_.isString(msg.msgData.roomJoin[currentRoomName].roomName) || currentRoomName != msg.msgData.roomJoin[currentRoomName].roomName) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            return;
                        }
                    }
                    break;

                case "roomLeave" :
                    if (!_.isObject(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isObject(msg.msgData.roomLeave)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }

                    for (var currentRoomName in msg.msgData.roomLeave) {
                        if (!getOption("roomNameRegExp").test(currentRoomName) || !_.isObject(msg.msgData.roomLeave[currentRoomName]) || !_.isString(msg.msgData.roomLeave[currentRoomName].roomName) || currentRoomName != msg.msgData.roomLeave[currentRoomName].roomName) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            return;
                        }
                    }
                    break;

                case "setPresence" :
                    if (!_.isObject(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isObject(msg.msgData.setPresence) || _.isEmpty(msg.msgData.setPresence)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    if (msg.msgData.setPresence.show !== undefined && (!_.isString(msg.msgData.setPresence.show) || !getOption("presenceShowRegExp").test(msg.msgData.setPresence.show))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    if (msg.msgData.setPresence.status !== undefined && (!_.isString(msg.msgData.setPresence.status) || !getOption("presenceStatusRegExp").test(msg.msgData.setPresence.status))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    break;

                case "setRoomApiField" :
                    if (!_.isObject(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isObject(msg.msgData.setRoomApiField) || _.isEmpty(msg.msgData.setRoomApiField)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    if (!_.isString(msg.msgData.setRoomApiField.roomName) || !getOption("roomNameRegExp").test(msg.msgData.setRoomApiField.roomName)) {
                        callback(null, false, "MSG_REJECT_BAD_ROOM");
                        return;
                    }
                    if (msg.msgData.setRoomApiField.field !== undefined) {
                        if (!_.isObject(msg.msgData.setRoomApiField.field)) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            return;
                        }
                        try {
                            if (JSON.stringify(msg.msgData.setRoomApiField.field).length >= 4096) {
                                callback(null, false, "MSG_REJECT_BAD_SIZE");
                                return;
                            }
                        } catch (e) {
                            if (!_.isObject(msg.msgData.setRoomApiField.field)) {
                                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                                return;
                            }
                        }
                    }
                    break;

                case "setUserCfg" :
                    if (!_.isObject(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isObject(msg.msgData.setUserCfg) || _.isEmpty(msg.msgData.setUserCfg)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }

                    // setUserCfg.p2pList
                    if (msg.msgData.setUserCfg.p2pList !== undefined && (!_.isObject(msg.msgData.setUserCfg.p2pList) || _.isEmpty(msg.msgData.setUserCfg.p2pList))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    // TODO: Go through p2pList to confirm each key is an easyrtcid

                    // setUserCfg.userSettings
                    if (msg.msgData.setUserCfg.userSettings !== undefined && (!_.isObject(msg.msgData.setUserCfg.userSettings) || _.isEmpty(msg.msgData.setUserCfg.userSettings))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }

                    break;

                default:
                    // Reject all unknown msgType's
                    callback(null, false, "MSG_REJECT_BAD_TYPE");
                    return;
            }

            break;

        case "easyrtcMsg":
            // targetEasyrtcid
            if (msg.targetEasyrtcid !== undefined && (!_.isString(msg.targetEasyrtcid) || !getOption("easyrtcidRegExp").test(msg.targetEasyrtcid))) {
                callback(null, false, "MSG_REJECT_TARGET_EASYRTCID");
                return;
            }
            // targetGroup
            if (msg.targetGroup !== undefined && (!_.isString(msg.targetGroup) || !getOption("groupNameRegExp").test(msg.targetGroup))) {
                callback(null, false, "MSG_REJECT_TARGET_GROUP");
                return;
            }
            // targetRoom
            if (msg.targetRoom !== undefined && (!_.isString(msg.targetRoom) || !getOption("roomNameRegExp").test(msg.targetRoom))) {
                callback(null, false, "MSG_REJECT_TARGET_ROOM");
                return;
            }
            break;

        default:
            callback(null, false, "MSG_REJECT_BAD_TYPE");
            return;
    }

    // Incoming message syntactically valid
    callback(null, true, null);
};


/**
 * Will attempt to deliver an EasyRTC session id via a cookie. Requires that session management be enabled from within Express.
 *
 * @param       {Object} req            Http request object
 * @param       {Object} res            Http result object
 */
pub.util.sendSessionCookie = function(req, res) {
    // If sessions or session cookies are disabled, return without an error.
    if (!pub.getOption("sessionEnable") || !pub.getOption("sessionCookieEnable")) {
        return;
    }
    if (req.sessionID && (!req.cookies || !req.cookies["easyrtcsid"] || req.cookies["easyrtcsid"] != req.sessionID)) {
        try {
            pub.util.logDebug("Sending easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
            res.cookie("easyrtcsid", req.sessionID, {maxAge: 2592000000, httpOnly: false});
        } catch (e) {
            pub.util.logWarning("Problem setting easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
        }
    }
};


/**
 * Determine if a given application name has been defined.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether application is defined.
 */
pub.isApp = function(appName, callback) {
    callback(null, (e.app[appName] ? true : false));
};


/**
 * Creates a new EasyRTC application with default values. If a callback is provided, it will receive the new application object.
 *
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {?object} options       Options object with options to apply to the application. May be null.
 * @param       {appCallback} [callback] Callback with error and application object
 */
pub.createApp = function(appName, options, callback) {
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {
        };
    }
    if (!appName || !pub.getOption("appNameRegExp").test(appName)) {
        pub.util.logWarning("Can not create application with improper name: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Can not create application with improper name: '" + appName + "'"));
        return;
    }
    if (e.app[appName]) {
        pub.util.logWarning("Can not create application which already exists: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Can not create application which already exists: '" + appName + "'"));
        return;
    }
    if (!_.isObject(options)) {
        options = {};
    }

    pub.util.logDebug("Creating application: '" + appName + "'");

    e.app[appName] = {
        appName: appName,
        connection: {},
        field: {},
        group: {},
        option: {},
        room: {},
        session: {}
    };

    // Get the new app object
    pub.app(appName, function(err, appObj) {
        if (err) {
            callback(err);
            return;
        }

        // Set all options in options object. If any fail, an error will be sent to the callback.
        async.each(Object.keys(options), function(currentOptionName, asyncCallback) {
            appObj.setOption(currentOptionName, options[currentOptionName]);
            asyncCallback(null);
        },
                function(err) {
                    if (err) {
                        callback(new pub.util.ApplicationError("Could not set options when creating application: '" + appName + "'", err));
                        return;
                    }
                    // Set default application fields
                    var appDefaultFieldObj = appObj.getOption("appDefaultFieldObj");
                    if (_.isObject(appDefaultFieldObj)) {
                        for (var currentFieldName in appDefaultFieldObj) {
                            appObj.setField(
                                    currentFieldName,
                                    appDefaultFieldObj[currentFieldName].fieldValue,
                                    appDefaultFieldObj[currentFieldName].fieldOption,
                                    null
                                    );
                        }
                    }

                    if (appObj.getOption("roomDefaultEnable")) {
                        pub.events.emit("roomCreate", appObj, null, appObj.getOption("roomDefaultName"), null, function(err, roomObj){
                            if (err) {
                                callback(err);
                                return;
                            }
                            // Return app object to callback
                            callback(null, appObj);
                        });
                    }
                    else {
                        // Return app object to callback
                        callback(null, appObj);
                    }
                });
    });
};


/**
 * Contains the methods for interfacing with an EasyRTC application.
 *
 * The callback will receive an application object upon successful retrieval of application.
 *
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 *
 * The function does return an application object which is useful for chaining, however the callback approach is safer and provides additional information in the event of an error.
 *
 * @param       {?string} appName        Application name which uniquely identifies it on the server. Uses default application if null.
 * @param       {appCallback} [callback] Callback with error and application object
 */
pub.app = function(appName, callback) {

    /**
     * The primary method for interfacing with an EasyRTC application.
     *
     * @class       appObj
     * @memberof    pub
     */
    var appObj = {};
    if (!appName) {
        appName = pub.getOption("appDefaultName");
    }
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {
        };
    }
    if (!e.app[appName]) {
        pub.util.logDebug("Attempt to request non-existent application name: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Attempt to request non-existent application name: '" + appName + "'"));
        return;
    }


    /**
     * Expose all event functions
     * 
     * @memberof    pub.appObj
     */
    appObj.events = pub.events;


    /**
     * Expose all utility functions
     * 
     * @memberof    pub.appObj
     */
    appObj.util = pub.util;


    /**
     * Returns the application name for the application. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
     *
     * @memberof    pub.appObj
     * @return      {string}    The application name.
     */
    appObj.getAppName = function() {
        return appName;
    };


    /**
     * Sends the count of the number of connections in the app to a provided callback.
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
     */
    appObj.getConnectionCount = function(callback) {
        callback(null, appObj.getConnectionCountSync());
    };


    /**
     * Sends the count of the number of connections in the app to a provided callback.
     *
     * @memberof    pub.appObj
     * @returns     {Number} The current number of connections in a room.
     */
    appObj.getConnectionCountSync = function() {
        return _.size(e.app[appName].connection);
    };


    /**
     * Returns an array of all easyrtcids connected to the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of easyrtcids.
     */
    appObj.getConnectionEasyrtcids = function(callback) {
        var easyrtcids = [];
        for (var key in e.app[appName].connection) {
            easyrtcids.push(key);
        }
        callback(null, easyrtcids);
    };


    /**
     * Returns application level field object for a given field name to a provided callback.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
     */
    appObj.getField = function(fieldName, callback) {
        if (!e.app[appName].field[fieldName]) {
            pub.util.logDebug("Can not find app field: '" + fieldName + "'");
            callback(new pub.util.ApplicationWarning("Can not find app field: '" + fieldName + "'"));
            return;
        }
        callback(null, pub.util.deepCopy(e.app[appName].field[fieldName]));
    };


    /**
     * Returns application level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @returns     {Object}        Field object
     */
    appObj.getFieldSync = function(fieldName) {
        if (!e.app[appName].field[fieldName]) {
            return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
        }
        return pub.util.deepCopy(e.app[appName].field[fieldName]);
    };


    /**
     * Returns application level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @returns     {?*}            Field value. Can be any JSON object.
     */
    appObj.getFieldValueSync = function(fieldName) {
        if (!e.app[appName].field[fieldName]) {
            return null;
        }
        return pub.util.deepCopy(e.app[appName].field[fieldName].fieldValue);
    };


    /**
     * Returns an object containing all field names and values within the application. Can be limited to fields with isShared option set to true.
     *
     * @memberof    pub.appObj
     * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
     */
    appObj.getFields = function(limitToIsShared, callback) {
        var fieldObj = {};
        for (var fieldName in e.app[appName].field) {
            if (!limitToIsShared || e.app[appName].field[fieldName].fieldOption.isShared) {
                fieldObj[fieldName] = {
                    fieldName: fieldName,
                    fieldValue: pub.util.deepCopy(e.app[appName].field[fieldName].fieldValue)
                };
            }
        }
        callback(null, fieldObj);
    };


    /**
     * Returns an array of all group names within the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of group names.
     */
    appObj.getGroupNames = function(callback) {
        var groupNames = [];
        for (var key in e.app[appName].group) {
            groupNames.push(key);
        }
        callback(null, groupNames);
    };


    /**
     * Gets individual option value. Will first check if option is defined for the application, else it will revert to the global level option.
     *
     * @memberof    pub.appObj
     * @param       {String}    optionName  Option name
     * @return      {*}                     Option value (can be any JSON type)
     */
    appObj.getOption = function(optionName) {
        return ((e.app[appName].option[optionName] === undefined) ? pub.getOption(optionName) : (e.app[appName].option[optionName]));
    };


    /**
     * Returns an array of all room names within the application.
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of room names.
     */
    appObj.getRoomNames = function(callback) {
        var roomNames = [];
        for (var key in e.app[appName].room) {
            roomNames.push(key);
        }
        callback(null, roomNames);
    };


    /**
     * Returns an array of all easyrtcsids within the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array containing easyrtcsids.
     */
    appObj.getEasyrtcsids = function(callback) {
        var easyrtcsids = [];
        for (var key in e.app[appName].session) {
            easyrtcsids.push(key);
        }
        callback(null, easyrtcsids);
    };

    /**
     * Returns an array of all easyrtcsids within the application. Old SessionKey name kept for transition purposes. Use getEasyrtcsid();
     *
     * @memberof    pub.appObj
     * @ignore
     */
    appObj.getSessionKeys = appObj.getEasyrtcsids;


    /**
     * Gets connection status for a connection. It is possible for a connection to be considered connected without being authenticated.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {function(?Error, Boolean)} callback Callback with error and a boolean indicating if easyrtcid is connected.
     */
    appObj.isConnected = function(easyrtcid, callback) {
        if (e.app[appName] && e.app[appName].connection && e.app[appName].connection[easyrtcid]) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    };


    /**
     * Gets connection status for a connection. It is possible for a connection to be considered connected without being authenticated. Synchronous function.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @returns     {boolean}
     */
    appObj.isConnectedSync = function(easyrtcid) {
        if (e.app[appName] && e.app[appName].connection && e.app[appName].connection[easyrtcid]) {
            return true;
        } else {
            return false;
        }
    };


    /**
     * Sets individual option. Set value to NULL to delete the option (thus reverting to global option).
     *
     * @memberof    pub.appObj
     * @param       {String}    optionName  Option name
     * @param       {?*}        optionValue Option value
     * @return      {Boolean}               true on success, false on failure
     */
    appObj.setOption = function(optionName, optionValue) {
        // Can only set options which currently exist
        if (typeof e.option[optionName] == "undefined") {
            pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
            return false;
        }

        // If value is null, delete option from application (reverts to global option)
        if (optionValue == null) {
            if (!(e.app[appName].option[optionName] === 'undefined')) {
                delete e.app[appName].option[optionName];
            }
        } else {
            // Set the option value to be a full deep copy, thus preserving private nature of the private EasyRTC object.
            e.app[appName].option[optionName] = pub.util.deepCopy(optionValue);
        }
        return true;
    };


    /**
     * Sets application field value for a given field name.
     *
     * @memberof    pub.appObj
     * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
     * @param       {Object}    fieldValue
     * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
     * @param       {nextCallback} [next]       A success callback of form next(err).
     */
    appObj.setField = function(fieldName, fieldValue, fieldOption, next) {
        pub.util.logDebug("[" + appName + "] Setting field [" + fieldName + "]", fieldValue);
        if (!_.isFunction(next)) {
            next = pub.util.nextToNowhere;
        }

        if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
            pub.util.logWarning("Can not create application field with improper name: '" + fieldName + "'");
            next(new pub.util.ApplicationWarning("Can not create application field with improper name: '" + fieldName + "'"));
            return;
        }
        e.app[appName].field[fieldName] = {
            fieldName: fieldName,
            fieldValue: fieldValue,
            fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
        };

        next(null);
    };


    /**
     * Gets connection object for a given connection key. Returns null if connection not found.
     * The returned connection object includes functions for managing connection fields.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {connectionCallback} callback Callback with error and object containing EasyRTC connection object.
     */
    appObj.connection = function(easyrtcid, callback) {
        if (!e.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
            return;
        }

        if (!pub.socketServer) {
            pub.util.logError("Socket server undefined.");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + easyrtcid + "'"));
            return;
        }

        if (pub.socketServer.sockets.connected){
            if (!pub.socketServer.sockets.connected[easyrtcid] || pub.socketServer.sockets.connected[easyrtcid].disconnected) {
                pub.util.logWarning("Attempt to request non-existent socket: '" + easyrtcid + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + easyrtcid + "'"));
                return;
            }

            if (pub.socketServer.sockets.connected[easyrtcid].disconnected) {
                pub.util.logWarning("Attempt to request disconnected socket: '" + easyrtcid + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request disconnected socket: '" + easyrtcid + "'"));
                return;
            }
        }
        else {
            if (!pub.socketServer.sockets.sockets[easyrtcid] || pub.socketServer.sockets.sockets[easyrtcid].disconnected) {
                pub.util.logWarning("Attempt to request non-existent socket: '" + easyrtcid + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + easyrtcid + "'"));
                return;
            }

            if (pub.socketServer.sockets.sockets[easyrtcid].disconnected) {
                pub.util.logWarning("Attempt to request disconnected socket: '" + easyrtcid + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request disconnected socket: '" + easyrtcid + "'"));
                return;
            }
        }


        /**
         * @class       connectionObj
         * @memberof    pub.appObj
         */
        var connectionObj = {};

        // House the local session object
        var _sessionObj;

        /**
         * Expose all event functions
         * 
         * @memberof    pub.appObj.connectionObj
         */
        connectionObj.events = pub.events;


        /**
         * Expose all utility functions
         * 
         * @memberof    pub.appObj.connectionObj
         */
        connectionObj.util = pub.util;


        /**
         * Reference to connection's socket.io object. See http://socket.io/ for more information.
         *
         * @memberof    pub.appObj.connectionObj
         */
        if (pub.socketServer.sockets.connected){
            connectionObj.socket = pub.socketServer.sockets.connected[easyrtcid];
        }
        else {
            connectionObj.socket = pub.socketServer.sockets.sockets[easyrtcid];
        }


        /**
         * Returns the application object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {Object}    The application object
         */
        connectionObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the application name for the application to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {string}    The application name
         */
        connectionObj.getAppName = function() {
            return appName;
        };


        /**
         * Returns the easyrtcid for the connection.  Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {string}    Returns the connection's easyrtcid, which is the EasyRTC unique identifier for a socket connection.
         */
        connectionObj.getEasyrtcid = function() {
            return easyrtcid;
        };


        /**
         * Returns connection level field object for a given field name to a provided callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
         */
        connectionObj.getField = function(fieldName, callback) {
            if (!e.app[appName].connection[easyrtcid].field[fieldName]) {
                pub.util.logDebug("Can not find connection field: '" + fieldName + "'");
                callback(new pub.util.ApplicationWarning("Can not find connection field: '" + fieldName + "'"));
                return;
            }
            callback(null, pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName]));
        };


        /**
         * Returns connection level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @returns     {Object}    Field object
         */
        connectionObj.getFieldSync = function(fieldName) {
            if (!e.app[appName].connection[easyrtcid].field[fieldName]) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            return pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName]);
        };


        /**
         * Returns connection level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @returns     {?*}        Field value
         */
        connectionObj.getFieldValueSync = function(fieldName) {
            if (!e.app[appName].connection[easyrtcid].field[fieldName]) {
                return null;
            }
            return pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName].fieldValue);
        };


        /**
         * Returns an object containing all field names and values within the connection to a provided callback. Can be limited to fields with isShared option set to true.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
         */
        connectionObj.getFields = function(limitToIsShared, callback) {
            var fieldObj = {};
            for (var fieldName in e.app[appName].connection[easyrtcid].field) {
                if (!limitToIsShared || e.app[appName].connection[easyrtcid].field[fieldName].fieldOption.isShared) {
                    fieldObj[fieldName] = {
                        fieldName: fieldName,
                        fieldValue: pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName].fieldValue)
                    };
                }
            }
            callback(null, fieldObj);
        };


        /**
         * Returns an array of all room names which connection has entered.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {function(?Error, Array.<string>)} callback Callback with error and array of room names.
         */
        connectionObj.getRoomNames = function(callback) {
            var roomNames = [];
            for (var key in e.app[appName].connection[easyrtcid].room) {
                roomNames.push(key);
            }
            callback(null, roomNames);
        };


        /**
         * Returns the session object to which the connection belongs (if one exists). Returns a null if connection is not attached to a session (such as when sessions are disabled). Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {Object}    The session object. May be null if connection has not been joined to a session.
         */
        connectionObj.getSession = function() {
            return _sessionObj;
        };


        /**
         * TO BE REMOVED - Use getSession() instead.
         * Returns the session object which the connection belongs to. Will return null if connection is not in a session (such as if session handling is disabled).
         * 
         * @ignore
         * @memberof    pub.appObj.connectionObj
         * @param       {function(?Error, Object=)} callback Callback with error and Session object
         */
        connectionObj.getSessionObj = function(callback) {
            if (e.app[appName].connection[easyrtcid] && e.app[appName].connection[easyrtcid].toSession && e.app[appName].connection[easyrtcid].toSession.easyrtcsid) {
                appObj.session(e.app[appName].connection[easyrtcid].toSession.easyrtcsid, callback);
            }
            else {
                callback(null, null);
            }
        };


        /**
         * Returns the username associated with the connection. Returns NULL if no username has been set.
         * Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {String}    The username associated with the connection.
         */
        connectionObj.getUsername = function() {
            return e.app[appName].connection[easyrtcid].username;
        };


        /**
         * Joins the connection to a specified session. A connection can only be assigned to one session.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    easyrtcsid      EasyRTC session identifier
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.joinSession = function(easyrtcsid, next) {
            if (!e.app[appName].session[easyrtcsid]) {
                next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Session [" + easyrtcsid + "] does not exist. Could not join session"));
                return;
            }

            appObj.session(easyrtcsid, function(err, sessionObj) {
                if (err) {
                    next(err);
                    return;
                }

                if(!e.app[appName] || !e.app[appName].connection[easyrtcid] || !e.app[appName].session[easyrtcsid]) {
                    next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Session [" + easyrtcsid + "] does not exist. Could not join session"));
                    return;
                }

                e.app[appName].connection[easyrtcid].toSession = e.app[appName].session[easyrtcsid];
                e.app[appName].connection[easyrtcid].toSession.toConnection[easyrtcid] = e.app[appName].connection[easyrtcid];

                // Set local session object
                _sessionObj = sessionObj;

                next(null);
            });
        };


        /**
         * Sets connection authentication status for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Boolean}   isAuthenticated True/false as to if the connection should be considered authenticated.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setAuthenticated = function(isAuthenticated, next) {
            if (isAuthenticated) {
                e.app[appName].connection[easyrtcid].isAuthenticated = true;
            } else {
                e.app[appName].connection[easyrtcid].isAuthenticated = false;
            }
            next(null);
        };


        /**
         * Sets the credential for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {?*}        credential      Credential for the connection. Can be any JSON object.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setCredential = function(credential, next) {
            e.app[appName].connection[easyrtcid].credential = credential;
            next(null);
        };


        /**
         * Sets connection field value for a given field name.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object}    fieldValue
         * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
         * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
         */
        connectionObj.setField = function(fieldName, fieldValue, fieldOption, next) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] - Setting field [" + fieldName + "]", fieldValue);
            if (!_.isFunction(next)) {
                next = pub.util.nextToNowhere;
            }

            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create connection field with improper name: '" + fieldName + "'");
                next(new pub.util.ApplicationWarning("Can not create connection field with improper name: '" + fieldName + "'"));
                return;
            }

            e.app[appName].connection[easyrtcid].field[fieldName] = {
                fieldName: fieldName,
                fieldValue: fieldValue,
                fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
            };

            next(null);
        };


        /**
         * Sets the presence object for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Object}    presenceObj     A presence object.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setPresence = function(presenceObj, next) {
            if (presenceObj.show !== undefined) {
                e.app[appName].connection[easyrtcid].presence.show = presenceObj.show;
            }
            if (presenceObj.status !== undefined) {
                e.app[appName].connection[easyrtcid].presence.status = presenceObj.status;
            }
            if (presenceObj.type !== undefined) {
                e.app[appName].connection[easyrtcid].presence.type = presenceObj.type;
            }
            next(null);
        };


        /**
         * Sets the username string for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {?string}   username        Username to assign to the connection.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setUsername = function(username, next) {
            e.app[appName].connection[easyrtcid].username = username;
            next(null);
        };


        /**
         * Emits the roomData message with a clientListDelta for the current connection to other connections in rooms this connection is in.
         * Note: To send listDeltas for individual rooms, use connectionRoomObj.emitRoomDataDelta
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Boolean}   isLeavingAllRooms   Indicator if connection is leaving all rooms. Meant to be used upon disconnection / logoff.
         * @param       {function(?Error, Object=)} callback Callback of form (err, roomDataObj) which will contain the roomDataObj including all updated rooms of the connection and is designed to be returnable to the connection.
         */
        connectionObj.emitRoomDataDelta = function(isLeavingAllRooms, callback) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.emitRoomDataDelta'");
            if (!_.isFunction(callback)) {
                callback = function(err, roomDataObj) {
                };
            }

            var fullRoomDataDelta = {};

            var otherClients = {};

            // Generate a complete roomDelta for the current client
            connectionObj.generateRoomDataDelta(isLeavingAllRooms, function(err, newFullRoomDataDelta) {
                fullRoomDataDelta = newFullRoomDataDelta;

                // Running callback right away so client doesn't have to wait to continue
                callback(null, fullRoomDataDelta);

                // Populate otherClients object with other clients who share room(s)
                for (var currentRoomName in fullRoomDataDelta) {
                    for (var currentEasyrtcid in e.app[appName].room[currentRoomName].clientList) {
                        if (otherClients[currentEasyrtcid] === undefined) {
                            otherClients[currentEasyrtcid] = {};
                        }
                        otherClients[currentEasyrtcid][currentRoomName] = true;
                    }
                }

                // Emit custom roomData object to each client who shares a room with the current client
                for (var currentEasyrtcid in otherClients) {
                    var msg = {
                        "msgData": {
                            "roomData": {}
                        }
                    };

                    for (var currentRoomName in otherClients[currentEasyrtcid]) {
                        if (fullRoomDataDelta[currentRoomName]) {
                            msg.msgData.roomData[currentRoomName] = fullRoomDataDelta[currentRoomName];
                        }
                    }

                    // Anonymous wrapper to deliver arguments
                    (function(innerCurrentEasyrtcid, innerMsg){
                        connectionObj.getApp().connection(innerCurrentEasyrtcid, function(err, emitToConnectionObj) {
                            if (!err && innerCurrentEasyrtcid != easyrtcid && emitToConnectionObj) {
                                pub.events.emit("emitEasyrtcCmd", emitToConnectionObj, "roomData", innerMsg, null, function() {});
                            }
                        });
                    })(currentEasyrtcid, msg);
                }
            });
        };


        /**
         * Generates a full room clientList object for the given connection
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {?string}   [roomStatus="join"] Room status which allow for values of "join"|"update"|"leave".
         * @param       {?Object}   roomMap     Map of rooms to generate connection clientList for. If null, then all rooms will be used.
         * @param       {function(?Error, Object=)} callback    Callback which includes a formed roomData object .
         */
        connectionObj.generateRoomClientList = function(roomStatus, roomMap, callback) {
            if (!_.isString(roomStatus)) {
                roomStatus = "join";
            }

            if (!_.isObject(roomMap)) {
                roomMap = e.app[appName].connection[easyrtcid].room;
            }

            var roomData = {};

            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                // If room is not in the provided roomMap, then skip it.
                if (!roomMap[currentRoomName]) {
                    continue;
                }

                var connectionRoom = e.app[appName].connection[easyrtcid].room[currentRoomName];
                roomData[currentRoomName] = {
                    "roomName": currentRoomName,
                    "roomStatus": roomStatus,
                    "clientList": {}
                };

                // Empty current clientList
                connectionRoom.clientList = {};

                // Fill connection clientList, and roomData clientList for current room
                for (var currentEasyrtcid in connectionRoom.toRoom.clientList) {

                    var currentToConnection = connectionRoom.toRoom.clientList[currentEasyrtcid].toConnection;

                    connectionRoom.clientList[currentEasyrtcid] = {
                        "toConnection": currentToConnection
                    };

                    roomData[currentRoomName].clientList[currentEasyrtcid] = {
                        "easyrtcid": currentEasyrtcid,
                        "roomJoinTime": currentToConnection.room[currentRoomName].enteredOn,
                        "presence": currentToConnection.presence
                    };

                    if (currentToConnection.room[currentRoomName] && (!_.isEmpty(currentToConnection.room[currentRoomName].apiField))) {
                        roomData[currentRoomName].clientList[currentEasyrtcid].apiField = currentToConnection.room[currentRoomName].apiField;
                    }

                    if (currentToConnection.username) {
                        roomData[currentRoomName].clientList[currentEasyrtcid].username = currentToConnection.username;
                    }
                }

                // Include room fields (with isShared set to true)
                for (var fieldName in connectionRoom.toRoom.field) {
                    if (_.isObject(connectionRoom.toRoom.field[fieldName].fieldOption) && connectionRoom.toRoom.field[fieldName].fieldOption.isShared) {
                        if (!_.isObject(roomData[currentRoomName].field)) {
                            roomData[currentRoomName].field = {};
                        }
                        roomData[currentRoomName].field[fieldName] = {
                            "fieldName": fieldName,
                            "fieldValue": pub.util.deepCopy(connectionRoom.toRoom.field[fieldName].fieldValue)
                        };
                    }
                }

                // Updating timestamp of when clientList was retrieved. Useful for sending delta's later on.
                connectionRoom.gotListOn = Date.now();
            }
            callback(null, roomData);
        };


        /**
         * Generates a delta roomData object for the current user including all rooms the user is in. The result can be selectively parsed to deliver delta roomData objects to other clients.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Boolean}   isLeavingRoom   Indicates if connection is in the process of leaving the room.
         * @param       {function(?Error, Object=)} callback Callback of form (err, roomDataDelta).
         */
        connectionObj.generateRoomDataDelta = function(isLeavingRoom, callback) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.generateRoomDataDelta'");

            var roomDataDelta = {};

            // set the roomData's clientListDelta for each room the client is in
            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                roomDataDelta[currentRoomName] = {
                    "roomName": currentRoomName,
                    "roomStatus": "update",
                    "clientListDelta": {}
                };

                if (isLeavingRoom) {
                    roomDataDelta[currentRoomName].clientListDelta.removeClient = {};
                    roomDataDelta[currentRoomName].clientListDelta.removeClient[easyrtcid] = {"easyrtcid": easyrtcid};
                } else {
                    roomDataDelta[currentRoomName].clientListDelta.updateClient = {};
                    roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid] = {
                        "easyrtcid": easyrtcid,
                        "roomJoinTime": e.app[appName].connection[easyrtcid].room[currentRoomName].enteredOn,
                        "presence": e.app[appName].connection[easyrtcid].presence
                    };

                    if (!_.isEmpty(e.app[appName].connection[easyrtcid].apiField)) {
                        roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid].apiField = e.app[appName].connection[easyrtcid].apiField;
                    }
                    if (e.app[appName].connection[easyrtcid].username) {
                        roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid].username = e.app[appName].connection[easyrtcid].username;
                    }
                }
            }

            callback(null, roomDataDelta);
        };


        /**
         * Generates the roomList message object
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {function(?Error, Object=)} callback Callback with error and roomList object.
         */
        connectionObj.generateRoomList = function(callback) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.generateRoomList'");
            var roomList = {};

            for (var currentRoomName in e.app[appName].room) {
                roomList[currentRoomName] = {
                    "roomName": currentRoomName,
                    "numberClients": _.size(e.app[appName].room[currentRoomName].clientList)
                };
            }
            callback(null, roomList);
        };


        /**
         * Gets connection authentication status for the connection. It is possible for a connection to become disconnected and keep the authenticated flag. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @returns     {Boolean}   Authentication status
         */
        connectionObj.isAuthenticated = function() {
            if (e.app[appName].connection[easyrtcid] && e.app[appName].connection[easyrtcid].isAuthenticated) {
                return true;
            } else {
                return false;
            }
        };


        /**
         * Gets connection status for the connection. It is possible for a connection to be considered connected without being authenticated. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @returns     {Boolean}   Connection status
         */
        connectionObj.isConnected = function() {
            if (connectionObj.socket && connectionObj.socket.socket) {
                return connectionObj.socket.socket.connected;
            }
            else {
                return false;
            }
        };


        /**
         * Returns a boolean to the callback indicating if connection is in a given group. NOT YET IMPLEMENTED
         * @ignore
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    groupName Group name to check.
         * @param       {function(?Error, Boolean)} callback Callback with error and a boolean indicating if connection is in a room..
         */
        connectionObj.isInGroup = function(groupName, callback) {
            if (_.isString(groupName) && e.app[appName].connection[easyrtcid].group[groupName] !== undefined) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        };


        /**
         * Returns a boolean to the callback indicating if connection is in a given room
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
         * @param       {function(?Error, Boolean)} callback Callback with error and a boolean indicating if connection is in a room..
         */
        connectionObj.isInRoom = function(roomName, callback) {
            if (_.isString(roomName) && e.app[appName].connection[easyrtcid].room[roomName] !== undefined) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        };


        /**
         * Joins an existing room, returning a connectionRoom object.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC connection room object (same as calling room(roomName))
         */
        connectionObj.joinRoom = function(roomName, callback) {
            if (!roomName || !appObj.getOption("roomNameRegExp").test(roomName)) {
                pub.util.logWarning("[" + appName + "][" + easyrtcid + "] Can not enter room with improper name: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Can not enter room with improper name: '" + roomName + "'"));
                return;
            }
            // Check if room doesn't exist
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("[" + appName + "][" + easyrtcid + "] Can not enter room which doesn't exist: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Can not enter room which doesn't exist: '" + roomName + "'"));
                return;
            }

            // Check if client already in room
            if (e.app[appName].connection[easyrtcid].room[roomName]) {
                connectionObj.room(roomName, callback);
                return;
            }

            // Local private function to create the default connection-room object in the private variable
            var createConnectionRoom = function(roomName, appRoomObj, callback) {
                // Join room. Creates a default connection room object
                e.app[appName].connection[easyrtcid].room[roomName] = {
                    apiField: {},
                    enteredOn: Date.now(),
                    gotListOn: Date.now(),
                    clientList: {},
                    toRoom: e.app[appName].room[roomName]
                };

                // Add easyrtcid to room clientList
                e.app[appName].room[roomName].clientList[easyrtcid] = {
                    enteredOn: Date.now(),
                    modifiedOn: Date.now(),
                    toConnection: e.app[appName].connection[easyrtcid]
                };

                // Returns connection room object to callback.
                connectionObj.room(roomName, callback);
            };

            appObj.room(roomName, function(err, appRoomObj) {
                if (err) {
                    callback(err);
                    return;
                }
                createConnectionRoom(roomName, appRoomObj, callback);
            });
        };


        /**
         * Gets room object for a given room name. Returns null if room not found.
         * The returned room object includes functions for managing room fields.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC connection room object.
         */
        connectionObj.room = function(roomName, callback) {
            if (_.isUndefined(e.app[appName].connection[easyrtcid].room[roomName])) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }

            /**
             * This is a gateway object connecting connections to the rooms they are in.
             *
             * @class       connectionRoomObj
             * @memberof    pub.appObj.connectionObj
             */
            var connectionRoomObj = {};

            // House the local room object
            var _roomObj;


            /**
             * Expose all event functions
             * 
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             */
            connectionRoomObj.events = pub.events;


            /**
             * Expose all utility functions
             * 
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             */
            connectionRoomObj.util = pub.util;


            /**
             * Returns the application object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {Object}    The application object
             */
            connectionRoomObj.getApp = function() {
                return appObj;
            };


            /**
             * Returns the application name for the application to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {string}    The application name
             */
            connectionRoomObj.getAppName = function() {
                return appName;
            };


            /**
             * Returns the connection object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {Object}    The application object
             */
            connectionRoomObj.getConnection = function() {
                return connectionObj;
            };


            /**
             * Returns the room object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {Object}    The room object
             */
            connectionRoomObj.getRoom = function() {
                return _roomObj;
            };


            /**
             * Returns the room name to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {string}    The room name
             */
            connectionRoomObj.getRoomName = function() {
                return roomName;
            };


            /**
             * Leaves the current room. Any room variables will be lost.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {nextCallback} [next]   A success callback of form next(err).
             */
            connectionRoomObj.leaveRoom = function(next) {
                if (!_.isFunction(next)) {
                    next = pub.util.nextToNowhere;
                }

                if (appObj.isRoomSync(roomName)){
                    e.app[appName].room[roomName].modifiedOn = Date.now();
                    delete e.app[appName].room[roomName].clientList[easyrtcid];
                }

                if (e.app[appName].connection[easyrtcid]){
                    delete e.app[appName].connection[easyrtcid].room[roomName];
                }

                connectionRoomObj.emitRoomDataDelta(true, function(err, roomDataObj) {
                    next(err);
                });
            };


            /**
             * Emits the roomData message with a clientListDelta for the current connection to other connections in the same room.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {boolean}   isLeavingRoom   Is connection leaving the room?
             * @param       {function(?Error, Object=)} callback Callback with error and room data delta object.
             */
            connectionRoomObj.emitRoomDataDelta = function(isLeavingRoom, callback) {
                pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Room [" + roomName + "] Running func 'connectionRoomObj.emitRoomDataDelta'");
                if (!_.isFunction(callback)) {
                    callback = function(err, roomDataObj) {
                    };
                }

                connectionRoomObj.generateRoomDataDelta(isLeavingRoom, function(err, roomDataDelta) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (!appObj.isRoomSync(roomName)) {
                        pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                        callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                        return;
                    }

                    var msg = {"msgData": {"roomData": {}}};
                    msg.msgData.roomData[roomName] = roomDataDelta;

                    for (var currentEasyrtcid in e.app[appName].room[roomName].clientList) {
                        // Anonymous wrapper to deliver arguments
                        (function(innerCurrentEasyrtcid, innerMsg){
                            connectionObj.getApp().connection(innerCurrentEasyrtcid, function(err, emitToConnectionObj) {
                                if (!err && innerCurrentEasyrtcid != easyrtcid && emitToConnectionObj) {
                                    pub.events.emit("emitEasyrtcCmd", emitToConnectionObj, "roomData", innerMsg, null, function() {
                                    });
                                }
                            });
                        })(currentEasyrtcid, msg);

                    }
                    callback(null, roomDataDelta);
                });
            };


            /**
             * Generated the roomData[room] message with a clientListDelta for the current connection to other connections in the same room.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {boolean}   isLeavingRoom   Is connection leaving the room?
             * @param       {function(?Error, Object=)} callback Callback with error and room data delta object.
             */
            connectionRoomObj.generateRoomDataDelta = function(isLeavingRoom, callback) {
                pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Room [" + roomName + "] Running func 'connectionRoomObj.generateRoomDataDelta'");
                if (!_.isFunction(callback)) {
                    callback = pub.util.nextToNowhere;
                }
                if (!appObj.isRoomSync(roomName)) {
                    pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                    callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                    return;
                }
                var roomDataDelta = {"roomName": roomName, "roomStatus": "update", "clientListDelta": {}};

                if (isLeavingRoom) {
                    roomDataDelta.clientListDelta.removeClient = {};
                    roomDataDelta.clientListDelta.removeClient[easyrtcid] = {"easyrtcid": easyrtcid};
                } else {
                    var connectionRoom = e.app[appName].connection[easyrtcid].room[roomName];
                    roomDataDelta.clientListDelta.updateClient = {};
                    roomDataDelta.clientListDelta.updateClient[easyrtcid] = {
                        "easyrtcid": easyrtcid,
                        "roomJoinTime": e.app[appName].connection[easyrtcid].room[roomName].enteredOn,
                        "presence": e.app[appName].connection[easyrtcid].presence
                    };

                    if (!_.isEmpty(e.app[appName].connection[easyrtcid].room[roomName].apiField)) {
                        roomDataDelta.clientListDelta.updateClient[easyrtcid].apiField = e.app[appName].connection[easyrtcid].room[roomName].apiField;
                    }
                    if (e.app[appName].connection[easyrtcid].username) {
                        roomDataDelta.clientListDelta.updateClient[easyrtcid].username = e.app[appName].connection[easyrtcid].username;
                    }
                }

                callback(null, roomDataDelta);
            };

            /**
             * Sets the API field for the current connection in a room.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {object}    apiFieldObj     A API field object, including the field name and field value.
             * @param       {nextCallback} next         A success callback of form next(err).
             */
            connectionRoomObj.setApiField = function(apiFieldObj, next) {
                if (!_.isFunction(next)) {
                    next = pub.util.nextToNowhere;
                }

                e.app[appName].connection[easyrtcid].room[roomName].apiField = pub.util.deepCopy(apiFieldObj);
                next(null);
            };

            // Set the roomObj before returning the connectionRoomObj
            appObj.room(roomName,
                    function(err, roomObj) {
                        _roomObj = roomObj;
                        callback(null, connectionRoomObj);
                    }
            );
        };


        /**
         * Removes a connection object. Does not (currently) remove connection from rooms or groups.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.removeConnection = function(next) {
            if (e.app[appName] && _.isObject(e.app[appName].connection) && e.app[appName].connection[easyrtcid]) {
                e.app[appName].connection[easyrtcid].isAuthenticated = false;
                // Remove link to connection from session in local storage
                if (e.app[appName].connection[easyrtcid].toSession) {
                    delete e.app[appName].connection[easyrtcid].toSession.toConnection[easyrtcid];
                }

                // Remove connection from local storage
                delete e.app[appName].connection[easyrtcid];
            }
            next(null);
        };

        // Before returning connectionObj, join the connection to a session (if available).
        if (e.app[appName].connection[easyrtcid].toSession) {
            appObj.session(e.app[appName].connection[easyrtcid].toSession.easyrtcsid, function(err, sessionObj) {
                if (err) {
                    callback(err);
                    return;
                }
                _sessionObj = sessionObj;
                callback(null, connectionObj);
            });
        } else {
            callback(null, connectionObj);
        }
    };


    /**
     * Creates a new connection with a provided connection key
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC connection object (same as calling connection(easyrtcid))
     */
    appObj.createConnection = function(easyrtcid, callback) {
        if (!easyrtcid || !appObj.getOption("easyrtcidRegExp").test(easyrtcid)) {
            pub.util.logWarning("Can not create connection with improper name: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Can not create connection with improper name: '" + easyrtcid + "'"));
            return;
        }

        if (e.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Can not create connection which already exists: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Can not create connection which already exists: '" + easyrtcid + "'"));
            return;
        }

        // Set the connection structure with some default values
        e.app[appName].connection[easyrtcid] = {
            easyrtcid: easyrtcid,
            connectOn: Date.now(),
            isAuthenticated: false,
            userName: null,
            credential: null,
            field: {},
            group: {},
            presence: {
                show: "chat",
                status: null
            },
            room: {},
            toApp: e.app[appName]
        };

        // Initialize a new connection object
        appObj.connection(easyrtcid, function(err, connectionObj) {
            if (err) {
                callback(err);
                return;
            }

            // Set default connection fields
            var connectionDefaultFieldObj = appObj.getOption("connectionDefaultFieldObj");
            if (_.isObject(connectionDefaultFieldObj)) {
                for (var currentFieldName in connectionDefaultFieldObj) {
                    connectionObj.setField(
                            currentFieldName,
                            connectionDefaultFieldObj[currentFieldName].fieldValue,
                            connectionDefaultFieldObj[currentFieldName].fieldOption,
                            null
                            );
                }
            }

            callback(null, connectionObj);
        });
    };


    /**
     * Counts how many occupants are in a room.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, number=)} callback Callback with error and client count
     */
    appObj.getRoomOccupantCount = function(roomName, callback) {
        if (!appObj.isRoomSync(roomName)) {
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }

        callback(null, _.size(e.app[appName].room[roomName].clientList));
    };

    /**
     * Delete an existing room, providing the room is empty.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, Object=)} callback Callback with error and true if a room was deleted.
     */
    appObj.deleteRoom = function(roomName, callback) {
        if (!roomName) {
            var errorMsg = "Can't delete room with a null room name";
            pub.util.logWarning(errorMsg);
            callback(new pub.util.ApplicationWarning(errorMsg), false);
            return;
        }

        // If room is already deleted or if it doesn't exist, then report success
        if (!appObj.isRoomSync(roomName)) {
            callback(null, true);
            return;
        }

        if (!_.isEmpty(e.app[appName].room[roomName].clientList)){
            var errorMsg = "Can't delete room " + roomName + " because it isn't empty";
            pub.util.logWarning(errorMsg);
            callback(new pub.util.ApplicationWarning(errorMsg), false);
            return;
        }

        e.app[appName].room[roomName].deleted = true;

        delete e.app[appName].room[roomName];
        callback(null, true);
    };


    /**
     * Creates a new room, sending the resulting room object to a provided callback.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {?object}   options     Options object with options to apply to the room. May be null.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC room object (same as calling appObj.room(roomName))
     */
    appObj.createRoom = function(roomName, options, callback) {
        if (!roomName || !appObj.getOption("roomNameRegExp").test(roomName)) {
            pub.util.logWarning("Can not create room with improper name: '" + roomName + "'");
            callback(new pub.util.ApplicationWarning("Can not create room with improper name: '" + roomName + "'"));
            return;
        }
        if (appObj.isRoomSync(roomName)) {
            pub.util.logWarning("Can not create room which already exists: '" + roomName + "'");
            callback(new pub.util.ApplicationWarning("Can not create room which already exists: '" + roomName + "'"));
            return;
        }
        if (!_.isObject(options)) {
            options = {};
        }
        pub.util.logDebug("Creating room: '" + roomName + "' with options:", options);

        e.app[appName].room[roomName] = {
            roomName: roomName,
            deleted: false,
            clientList: {},
            field: {},
            option: {},
            modifiedOn: Date.now()
        };

        // Initialize a new room object
        appObj.room(roomName, function(err, roomObj) {
            if (err) {
                callback(err);
                return;
            }

            // Set all options in options object. If any fail, an error will be sent to the callback.
            async.each(Object.keys(options), function(currentOptionName, asyncCallback) {
                roomObj.setOption(currentOptionName, options[currentOptionName]);
                asyncCallback(null);
            },
                    function(err) {
                        if (err) {
                            callback(new pub.util.ApplicationError("Could not set options when creating room: '" + roomName + "'", err));
                            return;
                        }

                        // Set default room fields
                        var roomDefaultFieldObj = roomObj.getOption("roomDefaultFieldObj");

                        if (_.isObject(roomDefaultFieldObj)) {
                            for (var currentFieldName in roomDefaultFieldObj) {
                                roomObj.setField(
                                        currentFieldName,
                                        roomDefaultFieldObj[currentFieldName].fieldValue,
                                        roomDefaultFieldObj[currentFieldName].fieldOption,
                                        null
                                        );
                            }
                        }

                        // Return room object to callback
                        callback(null, roomObj);
                    });
        });
    };


    /**
     * Creates a new session with a provided easyrtcsid
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid  EasyRTC Session Identifier. Must be formatted according to "easyrtcsidRegExp" option.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC session object (same as calling session(easyrtcsid))
     */
    appObj.createSession = function(easyrtcsid, callback) {
        pub.util.logDebug("[" + appObj.getAppName() + "] Creating session [" + easyrtcsid + "]");

        if (!easyrtcsid || !appObj.getOption("easyrtcsidRegExp").test(easyrtcsid)) {
            pub.util.logWarning("Can not create session with improper name [" + easyrtcsid + "]");
            callback(new pub.util.ConnectionWarning("Can not create session with improper name [" + easyrtcsid + "]"));
            return;
        }

        if (e.app[appName].session[easyrtcsid]) {
            pub.util.logWarning("Can not create session which already exists [" + easyrtcsid + "]");
            callback(new pub.util.ConnectionWarning("Can not create session which already exists [" + easyrtcsid + "]"));
            return;
        }

        // Set the session structure with some default values
        e.app[appName].session[easyrtcsid] = {
            "easyrtcsid": easyrtcsid,
            "startOn": Date.now(),
            "toConnection":{},
            "field": {}
        };

        appObj.session(easyrtcsid, callback);
    };


    /**
     * Checks if a provided room is defined. The callback returns a boolean if room is defined.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether room is defined.
     */
    appObj.isRoom = function(roomName, callback) {
        callback(null,((e.app[appName] && e.app[appName].room[roomName] && !e.app[appName].room[roomName].deleted) ? true : false));
    };


    /**
     * Checks if a provided room is defined. This is a synchronous function, thus may not be available in custom cases where room state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @return      {Boolean}               Returns boolean. True if room is defined.
     */
    appObj.isRoomSync = function(roomName) {
        return ((e.app[appName] && e.app[appName].room[roomName] && !e.app[appName].room[roomName].deleted) ? true : false);
    };


    /**
     * Checks if a provided session is defined. The callback returns a boolean if session is defined
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid      EasyRTC session identifier
     * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether session is defined.
     */
    appObj.isSession = function(easyrtcsid, callback) {
        callback(null, (e.app[appName].session[easyrtcsid] ? true : false));
    };


    /**
     * NOT YET IMPLEMENTED - Gets group object for a given group name. Returns null if group not found.
     * The returned group object includes functions for managing group fields.
     *
     * @memberof    pub.appObj
     * @param       {string}    groupName   Group name
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC group object.
     */
    appObj.group = function(groupName, callback) {
        if (!e.app[appName].group[groupName]) {
            pub.util.logWarning("Attempt to request non-existent group name: '" + groupName + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent group name: '" + groupName + "'"));
            return;
        }

        var groupObj = {};

        /**
         * Expose all event functions
         */
        groupObj.events = pub.events;

        /**
         * Expose all utility functions
         */
        groupObj.util = pub.util;

        /**
         * NOT YET IMPLEMENTED - Returns an array of all connected clients within the room.
         *
         * @ignore
         * @param {function(?Error, Array.<string>)} callback Callback with error and array containing all easyrtcids.
         */
        groupObj.getConnections = function(callback) {
            var connectedEasyrtcidArray = [];
            for (var key in e.app[appName].group[groupName].clientList) {
                connectedEasyrtcidArray.push(key);
            }
            callback(null, connectedEasyrtcidArray);
        };

        callback(null, groupObj);
    };


    /**
     * Gets room object for a given room name. Returns null if room not found.
     * The returned room object includes functions for managing room fields.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC room object.
     */
    appObj.room = function(roomName, callback) {
        if (!appObj.isRoomSync(roomName)) {
            pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }

        /**
         * EasyRTC Room Object. Contains methods for handling a specific room including determining which connections have joined.
         *
         * @class       roomObj
         * @memberof    pub.appObj
         */
        var roomObj = {};


        /**
         * Expose all event functions
         *
         * @memberof    pub.appObj.roomObj
         */
        roomObj.events = pub.events;


        /**
         * Expose all utility functions
         *
         * @memberof    pub.appObj.roomObj
         */
        roomObj.util = pub.util;


        /**
         * Returns the application object to which the room belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.roomObj
         * @return      {Object}    The application object
         */
        roomObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the application name for the application to which the room belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.roomObj
         * @return      {string}    The application name
         */
        roomObj.getAppName = function() {
            return appName;
        };


        /**
         * Returns the room name for the current room. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.roomObj
         * @return      {string}    The room name
         */
        roomObj.getRoomName = function() {
            return roomName;
        };


        /**
         * INCOMPLETE: Emits a roomData message containing fields to all connections in the current room. This is meant to be called after a room field has been set or updated. 
         * @ignore 
         */
        roomObj.emitRoomDataFieldUpdate = function(skipEasyrtcid, next) {
            roomObj.getFields(true, function(err, fieldObj) {
                if (err) {
                    next(err);
                    return;
                }
                if (!appObj.isRoomSync(roomName)) {
                    pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                    next(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                    return;
                }

                var outgoingMsg = {"msgData": {"roomData": {}}};
                outgoingMsg.msgData.roomData[roomName] = {
                    "roomName": roomName,
                    "roomStatus": "update"
                };
                outgoingMsg.msgData.roomData[roomName].field = fieldObj;

                async.each(
                        Object.keys(e.app[appName].room[roomName].clientList),
                        function(currentEasyrtcid, asyncCallback) {

                            // Skip a given easyrtcid?
                            if (skipEasyrtcid && (skipEasyrtcid == currentEasyrtcid)) {
                                asyncCallback(null);
                                return;
                            }

                            // Retrieve a connection object, then send the roomData message.
                            appObj.connection(currentEasyrtcid, function(err, targetConnectionObj) {
                                if (err || !_.isObject(targetConnectionObj)) {
                                    pub.util.logDebug("[" + currentEasyrtcid + "] Could not get connection object to send room data field update. Client may have disconnected.");
                                    asyncCallback(null);
                                    return;
                                }
                                pub.events.emit("emitEasyrtcCmd", targetConnectionObj, "roomData", outgoingMsg, function(msg) {
                                }, function(err) {
                                    // Ignore errors if unable to send to a socket. 
                                    asyncCallback(null);
                                });
                            });
                        },
                        function(err) {
                            next(null);
                        }
                );
            });
        };


        /**
         * Returns room level field object for a given field name to a provided callback.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName   Field name
         * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
         */
        roomObj.getField = function(fieldName, callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            if (!e.app[appName].room[roomName].field[fieldName]) {
                pub.util.logDebug("Can not find room field: '" + fieldName + "'");
                callback(new pub.util.ApplicationWarning("Can not find room field: '" + fieldName + "'"));
                return;
            }
            callback(null, pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName]));
        };


        /**
         * Returns room level field object for a given field name. If the field is not set, it will return a field value will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName   Field name
         * @returns     {Object}        Field object
         */
        roomObj.getFieldSync = function(fieldName) {
            if (!appObj.isRoomSync(roomName)) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            if (!e.app[appName].room[roomName].field[fieldName]) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            return pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName]);
        };


        /**
         * Returns room level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName   Field name
         * @returns     {?*}        Field value
         */
        roomObj.getFieldValueSync = function(fieldName) {
            if (!appObj.isRoomSync(roomName)) {
                return null;
            }
            if (!e.app[appName].room[roomName].field[fieldName]) {
                return null;
            }
            return pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName].fieldValue);
        };


        /**
         * Returns an object containing all field names and values within the room. Can be limited to fields with isShared option set to true.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
         */
        roomObj.getFields = function(limitToIsShared, callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            var fieldObj = {};
            for (var fieldName in e.app[appName].room[roomName].field) {
                if (!limitToIsShared || e.app[appName].room[roomName].field[fieldName].fieldOption.isShared) {
                    fieldObj[fieldName] = {
                        fieldName: fieldName,
                        fieldValue: pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName].fieldValue)
                    };
                }
            }
            callback(null, fieldObj);
        };


        /**
         * Gets individual option value. Will first check if option is defined for the room, else it will revert to the application level option (which will in turn fall back to the global level).
         *
         * @memberof    pub.appObj.roomObj
         * @param       {String}    optionName  Option name
         * @return      {*}         Option value (can be any type)
         */
        roomObj.getOption = function(optionName) {
            return ((!appObj.isRoomSync(roomName) || e.app[appName].room[roomName].option[optionName] === undefined) ? appObj.getOption(optionName) : (e.app[appName].room[roomName].option[optionName]));
        };


        /**
         * Sets individual option which applies only to this room. Set value to NULL to delete the option (thus reverting to global option)
         *
         * @memberof    pub.appObj.roomObj
         * @param       {Object}    optionName  Option name
         * @param       {Object}    optionValue Option value
         * @return      {Boolean}               true on success, false on failure
         */
        roomObj.setOption = function(optionName, optionValue) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                return false;
            }
            // Can only set options which currently exist
            if (typeof e.option[optionName] == "undefined") {
                pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
                return false;
            }

            // If value is null, delete option from application (reverts to global option)
            if (optionValue == null) {
                if (!(e.app[appName].option[optionName] === undefined)) {
                    delete e.app[appName].room[roomName].option[optionName];
                }
            } else {
                // Set the option value to be a full deep copy, thus preserving private nature of the private EasyRTC object.
                e.app[appName].room[roomName].option[optionName] = pub.util.deepCopy(optionValue);
            }
            return true;
        };


        /**
         * Incomplete function for setting an easyrtcid as being a client in a room.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
         * @param       {nextCallback} next     A success callback of form next(err).
         * @ignore
         */
        roomObj.setConnection = function(easyrtcid, next) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                next(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            pub.util.logWarning("Using deprecated roomObj.setConnection() function");
            e.app[appName].room[roomName].clientList[easyrtcid] = {enteredOn: Date.now()};
            next(null);
        };


        /**
         * Sets room field value for a given field name.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object}    fieldValue
         * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
         * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
         */
        roomObj.setField = function(fieldName, fieldValue, fieldOption, next) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                next(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            pub.util.logDebug("[" + appName + "] Room [" + roomName + "] - Setting field [" + fieldName + "]", fieldValue);
            if (!_.isFunction(next)) {
                next = pub.util.nextToNowhere;
            }

            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create room field with improper name: '" + fieldName + "'");
                next(new pub.util.ApplicationWarning("Can not create room field with improper name: '" + fieldName + "'"));
                return;
            }

            e.app[appName].room[roomName].field[fieldName] = {
                fieldName: fieldName,
                fieldValue: fieldValue,
                fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
            };

            next(null);
        };


        /**
         * Sends the count of the number of connections in a room to a provided callback.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
         */
        roomObj.getConnectionCount = function(callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            callback(null, roomObj.getConnectionCountSync());
        };


        /**
         * Sends the count of the number of connections in a room to a provided callback. Returns 0 if room doesn't exist.
         *
         * @memberof    pub.appObj.roomObj
         * @returns     {Number} The current number of connections in a room.
         */
        roomObj.getConnectionCountSync = function() {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                return 0;
            }
            return _.size(e.app[appName].room[roomName].clientList);
        };


        /**
         * Returns an array containing the easyrtcids of all connected clients within the room.
         *
         * @memberof    pub.appObj.roomObj
         * @param {function(?Error, Array.<string>=)} callback Callback with error and array containing all easyrtcids.
         */
        roomObj.getConnections = function(callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            var connectedEasyrtcidArray = [];
            for (var key in e.app[appName].room[roomName].clientList) {
                connectedEasyrtcidArray.push(key);
            }
            callback(null, connectedEasyrtcidArray);
        };


        /**
         * Returns the connectionObj for a given easyrtcid, but only if it is currently a client in the room
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
         * @param {function(?Error, Object=)} callback Callback with error and connectionObj.
         */
        roomObj.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            if (e.app[appName].room[roomName].clientList[easyrtcid]){
                appObj.connection(easyrtcid, function(err, connectionObj) {
                    if (err) {
                        callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "] in room."));
                        return;
                    }
                    // If there is no error, than run callback with the connection object.
                    callback(null, connectionObj);
                });
            }
            else {
                callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "] in room."));
            }
        };


        /**
         * Returns an array containing the connectionObjs of all connected clients within the room.
         *
         * @memberof    pub.appObj.roomObj
         * @param {function(?Error, Array.<Object>=)} callback Callback with error and array containing connectionObjs.
         */
        roomObj.getConnectionObjects = function(callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            var connectedObjArray = [];
            async.each(Object.keys(e.app[appName].room[roomName].clientList),
                    function(currentEasyrtcid, asyncCallback) {
                        appObj.connection(currentEasyrtcid, function(err, connectionObj) {
                            if (err) {
                                // We will silently ignore errors
                                asyncCallback(null);
                                return;
                            }
                            // If there is no error, than push the connection object.
                            connectedObjArray.push(connectionObj);
                            asyncCallback(null);
                        });
                    },
                    function(err) {
                        callback(null, connectedObjArray);
                    }
            );
        };

        callback(null, roomObj);
    };


    /**
     * NOT YET IMPLEMENTED - Gets session object for a given easyrtcsid. Returns null if session not found.
     * The returned session object includes functions for managing session fields.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid      EasyRTC session identifier
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC session object.
     */
    appObj.session = function(easyrtcsid, callback) {

        if (!e.app[appName].session[easyrtcsid]) {
            pub.util.logWarning("Attempt to request non-existent easyrtcsid: '" + easyrtcsid + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent easyrtcsid: '" + easyrtcsid + "'"));
            return;
        }

        /**
         * The primary method for interfacing with an EasyRTC session.
         *
         * @class       sessionObj
         * @memberof    pub.appObj
         */
        var sessionObj = {};


        /**
         * Expose all event functions
         *
         * @memberof    pub.appObj.sessionObj
         */
        sessionObj.events = pub.events;


        /**
         * Expose all utility functions
         *
         * @memberof    pub.appObj.sessionObj
         */
        sessionObj.util = pub.util;


        /**
         * Returns the application object to which the session belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @return      {Object}    The application object
         */
        sessionObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the application name for the application to which the session belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @return      {string}    The application name
         */
        sessionObj.getAppName = function() {
            return appName;
        };


        /**
         * Returns the easyrtcsid for the session.  Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @return      {string}    Returns the easyrtcsid, which is the EasyRTC unique identifier for a session.
         */
        sessionObj.getEasyrtcsid = function() {
            return easyrtcsid;
        };

        /**
         * Returns the easyrtcsid for the session. Old SessionKey name kept for transition purposes. Use getEasyrtcsid();
         * 
         * @memberof    pub.appObj.sessionObj
         * @ignore
         */
        sessionObj.getSessionKey = sessionObj.getEasyrtcsid;


        /**
         * Returns session level field object for a given field name to a provided callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName   Field name
         * @param       {function(?Error, Object=)} callback Callback with error and field value (any type)
         */
        sessionObj.getField = function(fieldName, callback) {
            if (!e.app[appName].session[easyrtcsid].field[fieldName]) {
                pub.util.logDebug("Can not find session field: '" + fieldName + "'");
                callback(new pub.util.ApplicationWarning("Can not find session field: '" + fieldName + "'"));
                return;
            }
            callback(null, pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName]));
        };


        /**
         * Returns session level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName   Field name
         * @returns     {Object}    Field object
         */
        sessionObj.getFieldSync = function(fieldName) {
            if (!e.app[appName].session[easyrtcsid].field[fieldName]) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            return pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName]);
        };


        /**
         * Returns session level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName   Field name
         * @returns     {?*}        Field value
         */
        sessionObj.getFieldValueSync = function(fieldName) {
            if (!e.app[appName].session[easyrtcsid].field[fieldName]) {
                return null;
            }
            return pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName].fieldValue);
        };


        /**
         * Returns an object containing all field names and values within the session to a provided callback. Can be limited to fields with isShared option set to true.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
         */
        sessionObj.getFields = function(limitToIsShared, callback) {
            var fieldObj = {};
            for (var fieldName in e.app[appName].session[easyrtcsid].field) {
                if (!limitToIsShared || e.app[appName].session[easyrtcsid].field[fieldName].fieldOption.isShared) {
                    fieldObj[fieldName] = {
                        fieldName: fieldName,
                        fieldValue: pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName].fieldValue)
                    };
                }
            }
            callback(null, fieldObj);
        };


        /**
         * Sets session field value for a given field name.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object}    fieldValue
         * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
         * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
         */
        sessionObj.setField = function(fieldName, fieldValue, fieldOption, next) {
            pub.util.logDebug("[" + appName + "] Session [" + easyrtcsid + "] - Setting field [" + fieldName + "]", fieldValue);
            if (!_.isFunction(next)) {
                next = pub.util.nextToNowhere;
            }

            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create session field with improper name: '" + fieldName + "'");
                next(new pub.util.ApplicationWarning("Can not create session field with improper name: '" + fieldName + "'"));
                return;
            }

            e.app[appName].session[easyrtcsid].field[fieldName] = {
                fieldName: fieldName,
                fieldValue: fieldValue,
                fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
            };

            next(null);
        };

        sessionObj.emitSessionDataFieldUpdate = function(next) {
            sessionObj.getFields(true, function(err, fieldObj) {
                if (err) {
                    next(err);
                    return;
                }
                var outgoingMsg = {"msgData": {"sessionData": {}}};
                outgoingMsg.msgData.sessionData = {
                    "easyrtcsid": easyrtcsid,
                    "sessionStatus": "update"
                };
                outgoingMsg.msgData.sessionData.field = fieldObj;
                // Loop through all active connection objects belonging to session
                async.each(
                    Object.keys(e.app[appName].session[easyrtcsid].toConnection),
                    function(currentEasyrtcid, asyncCallback) {

                        // Retrieve a connection object, then send the sessionData message.
                        appObj.connection(currentEasyrtcid, function(err, targetConnectionObj) {
                            if (err || !_.isObject(targetConnectionObj)) {
                                pub.util.logDebug("[" + currentEasyrtcid + "] Could not get connection object to send session data field update. Client may have disconnected.");
                                asyncCallback(null);
                                return;
                            }

                            // Emit sessionData easyrtcCmd to each connection
                            pub.events.emit("emitEasyrtcCmd", targetConnectionObj, "sessionData", outgoingMsg, function(msg) {
                            }, function(err) {
                                // Ignore errors if unable to send to a socket. 
                                asyncCallback(null);
                            });
                        });
                    },
                    function(err) {
                        next(null);
                    }
                );
            });
        };

        callback(null, sessionObj);
    };

    callback(null, appObj);
};


// Documenting global callbacks
/**
 * The next callback is called upon completion of a method. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback nextCallback
 * @param {?Error}      err         Optional Error object. If it is null, than assume no error has occurred.
 */


/**
 * The application callback is called upon completion of a method which is meant to deliver an application object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback appCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     appObj      Application object. Will be null if an error has occurred.
 */


/**
 * The connection callback is called upon completion of a method which is meant to deliver a connection object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback connectionCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     connectionObj Connection object. Will be null if an error has occurred.
 */


/**
 * The room callback is called upon completion of a method which is meant to deliver a room object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback roomCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     roomObj     Room object. Will be null if an error has occurred.
 */

// Documenting Custom Type-Definitions
/**
 * An error object
 *
 * @typedef {Object} Error
 */

// Running the default listeners to initialize the events
pub.events.setDefaultListeners();

}).call(this,require('_process'))
},{"./easyrtc_default_event_listeners":2,"./easyrtc_private_obj":4,"./easyrtc_util":7,"./general_util":8,"_process":33,"async":9,"events":29,"http":52,"underscore":21}],6:[function(require,module,exports){
(function (process){
/**
 * @file        Entry library for EasyRTC server. Houses the primary listen function.
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var g           = require("./general_util");        // General utility functions local module
g.checkModules(); // Check to ensure all required modules are available

var _           = require("underscore");            // General utility functions external module
var pub         = require("./easyrtc_public_obj");  // EasyRTC public object


/**
 * Listener for starting the EasyRTC server. The successCallback can be used to determine when EasyRTC is fully running.
 *
 * @param       {Object} httpApp        express http object. Allows EasyRTC to interact with the http server.
 * @param       {Object} socketServer   socket.io server object. Allows EasyRTC to interact with the socket server.
 * @param       {Object} options        EasyRTC options object. Sets configurable options. If null, than defaults will be used.
 * @param       {function(Error, Object)} listenCallback Called when the start up routines are complete. In form of successCallback(err, pub). The parameter 'err' will null unless an error occurs and 'pub' is the EasyRTC public object for interacting with the server.
 */
exports.listen = function(httpApp, socketServer, options, listenCallback) {
    pub.util.logInfo("Starting EasyRTC Server (v" + pub.getVersion() +") on Node (" + process.version + ")");

    // Set server object references in public object
    pub.httpApp         = httpApp;
    pub.socketServer    = socketServer;

    if (options){
        pub.util.logDebug("Overriding options", options);

        for (var optionName in options) {
            pub.setOption(optionName, options[optionName]);
        }
    }

    pub.util.logDebug("Emitting event 'startup'");
    pub.events.emit("startup", function(err) {
        if (err) {
            pub.util.logError("Error occurred upon startup", err);
            if(_.isFunction(listenCallback)) {
                listenCallback(err, null);
            }
        }
        else {
            pub.util.logInfo("EasyRTC Server Ready For Connections (v"+ pub.getVersion() + ")");
            if(_.isFunction(listenCallback)) {
                listenCallback(err, pub);
            }
        }
    });
};


/**
 * Returns an EasyRTC options object with a copy of the default options.
 *
 * @returns     {Object}                EasyRTC options object
 */
exports.getDefaultOptions = function() {
    var defaultOptions = require("./easyrtc_default_options");
    return g.deepCopy(defaultOptions);
};


/**
 * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one.
 *
 * @private
 * @param       {String} event          Listener name.
 * @param       {Function} listener       Function
 */
exports.on = function(event, listener) {
    if (event && _.isFunction(listener)) {
        pub.events.removeAllListeners(event);
        pub.events.on(event, listener);
    }
    else {
        pub.util.logError("Unable to add listener to event '" + event + "'");
    }
};


/**
 * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added.
 *
 * @private
 * @param       {String} event          Listener name.
 */
exports.removeAllListeners = function(event) {
    if (event) {
        pub.events.removeAllListeners(event);
        pub.events.setDefaultListener(event);
    }
};


/**
 * Returns the listeners for an event.
 *
 * @private
 * @param       {String} event          Listener name.
 */
exports.listeners = pub.events.listeners;


/**
 * Expose all event functions
 */
exports.events = pub.events;


/**
 * Expose public utility functions
 */
exports.util = pub.util;


/**
 * Sets individual option.
 *
 * @param       {Object} option Option name
 * @param       {Object} value  Option value
 * @returns     {Boolean} true on success, false on failure
 */
exports.setOption = pub.setOption;

}).call(this,require('_process'))
},{"./easyrtc_default_options":3,"./easyrtc_public_obj":5,"./general_util":8,"_process":33,"underscore":21}],7:[function(require,module,exports){
/**
 * Utility functions specific to EasyRTC.
 *
 * @module      easyrtc_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var util            = require("util");
var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // EasyRTC private object


/**
 *  Object to hold EasyRTC Utility methods and classes.
 *
 * @class
 */
var eu = module.exports;


/**
 * Disconnects socket. Failure results in a debug level log message.
 *
 * @param       {Object} socket         Socket.io connection object.
 */
eu.socketDisconnect = function(socket) {
    try {
        socket.disconnect();
    } catch(err) {
        eu.log("debug", "Socket disconnection command failed. Socket may already be disconnected.");
    }
};


/**
 * Custom Error Object for EasyRTC Server Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ServerError = function(msg) {
    eu.ServerError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ServerError, g.AbstractError);
eu.ServerError.prototype.name = "Server Error";
eu.ServerError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Application Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ApplicationError = function(msg) {
    eu.ApplicationError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ApplicationError, g.AbstractError);
eu.ApplicationError.prototype.name = "Application Error";
eu.ApplicationError.prototype.errorLevel = "error";


/**
 * Custom Error Object for Connection Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ConnectionError = function(msg) {
    eu.ConnectionError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ConnectionError, g.AbstractError);
eu.ConnectionError.prototype.name = "Connection Error";
eu.ConnectionError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Server Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ServerWarning = function(msg) {
    eu.ServerWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ServerWarning, g.AbstractError);
eu.ServerWarning.prototype.name = "Server Warning";
eu.ServerWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for EasyRTC Application Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ApplicationWarning = function(msg) {
    eu.ApplicationWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ApplicationWarning, g.AbstractError);
eu.ApplicationWarning.prototype.name = "Application Warning";
eu.ApplicationWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for Connection Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ConnectionWarning = function(msg) {
    eu.ConnectionWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ConnectionWarning, g.AbstractError);
eu.ConnectionWarning.prototype.name = "Connection Warning";
eu.ConnectionWarning.prototype.errorLevel = "warning";


/**
 * Determines if an Error object is an instance of ApplicationError, ConnectionError, or ServerError. If it is, it will return true.
 *
 * @param   {Error}     err
 * @return  {Boolean}
 */
eu.isError = function(err) {
    if (err && ((err instanceof eu.ConnectionError)||(err instanceof eu.ApplicationError)||(err instanceof eu.ServerError)||(err instanceof Error))) {
        return true;
    } else {
        return false;
    }
};


/**
 * Determines if an Error object is an instance of ApplicationWarning, ConnectionWarning, or ServerWarning. If it is, it will return true.
 *
 * @param   {Error}     err
 * @return  {Boolean}
 */
eu.isWarning = function(err) {
    if (err && ((err instanceof eu.ConnectionWarning)||(err instanceof eu.ApplicationWarning)||(err instanceof eu.ServerWarning))) {
        return true;
    } else {
        return false;
    }
};

},{"./easyrtc_private_obj":4,"./general_util":8,"underscore":21,"util":61}],8:[function(require,module,exports){
(function (process){
/**
 * @file        General utility functions not specific to EasyRTC
 * @module      general_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2015 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var util = require("util");

var g = {};


/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
g.deepCopy = function(input) {
    if (input == null
        || typeof input != "object"
        || (input.constructor != Object && input.constructor != Array)
    ) {
        return input;
    }

    if (
        input.constructor == Boolean
        || input.constructor == Date
        || input.constructor == Function
        || input.constructor == Number
        || input.constructor == RegExp
        || input.constructor == String
    ) {
        return new input.constructor(input);
    }

    if (input instanceof Array) {
        var copy = [];
        for (var i = 0, len = input.length; i < len; i++) {
            copy[i] = g.deepCopy(input[i]);
        }
        return copy;
    }

    if (input instanceof Object) {
        var copy = {};
        for (var key in input) {
            if (input.hasOwnProperty(key)) {
                copy[key] = g.deepCopy(input[key]);
            }
        }
        return copy;
    }
    return null;
};


/**
 * Returns a field from the package.json file in the module root.
 * Giving null field name will return the full contents of the file.
 * If a field name is provided, it will return null if the field not found.
 *
 * @param       {Object} fieldName      Name of field you wish to return.
 * @returns     {Object}                Value of the given field, or the full contents of the file if a null field is given.
 */
g.getPackageData = function(fieldName) {
    var packageFile = require("../package");
    if (!fieldName) {
        return g.deepCopy(packageFile);
    }
    else if (packageFile[fieldName]) {
        return g.deepCopy(packageFile[fieldName]);
    }
    else {
        return null;
    }
};


/* An abstract error object which should be easy to extend for custom Error classes.
 *
 * @copyright Based on code in article by Dustin Seno.
 *
 * @param   {String}    Custom error message.
 * @param   {Object}    Constructor property.
 *
 */
g.AbstractError = function(msg, constr){
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "Error";
};
util.inherits(g.AbstractError, Error);
g.AbstractError.prototype.name = "Abstract Error";


/**
 * Reads package.json and ensures all required modules are installed. Will exit if one or more is not found.
 */
g.checkModules = function () {
    try {
        var easyrtcPackage = require("../package");
    }
    catch( e ) {
        console.log("ERROR: Could not load package.json from project root. This file is required for reading project properties.");
        process.exit(1);
    }

    var moduleExists = function (modName) {
        try { return require.resolve(modName); }
        catch( e ) { return false; }
    };

    var isModuleMissing = false;
    for (var key in easyrtcPackage.dependencies) {
        if (!moduleExists(key)) {
            isModuleMissing = true;
            console.log("ERROR: Missing module '" + key + "'");
        }
    }

    if (isModuleMissing) {
        console.log("ERROR: Required modules are not installed. Run 'npm install' from command line.");
        process.exit(1);
    }

    delete require.cache[easyrtcPackage];
};


module.exports = g;
}).call(this,require('_process'))
},{"../package":22,"_process":33,"util":61}],9:[function(require,module,exports){
(function (process){
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":33}],10:[function(require,module,exports){
/*

The MIT License (MIT)

Original Library 
  - Copyright (c) Marak Squires

Additional functionality
 - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var colors = {};
module['exports'] = colors;

colors.themes = {};

var ansiStyles = colors.styles = require('./styles');
var defineProps = Object.defineProperties;

colors.supportsColor = require('./system/supports-colors');

if (typeof colors.enabled === "undefined") {
  colors.enabled = colors.supportsColor;
}

colors.stripColors = colors.strip = function(str){
  return ("" + str).replace(/\x1B\[\d+m/g, '');
};


var stylize = colors.stylize = function stylize (str, style) {
  if (!colors.enabled) {
    return str+'';
  }

  return ansiStyles[style].open + str + ansiStyles[style].close;
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
var escapeStringRegexp = function (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe,  '\\$&');
}

function build(_styles) {
  var builder = function builder() {
    return applyStyle.apply(builder, arguments);
  };
  builder._styles = _styles;
  // __proto__ is used because we must return a function, but there is
  // no way to create a function with a different prototype.
  builder.__proto__ = proto;
  return builder;
}

var styles = (function () {
  var ret = {};
  ansiStyles.grey = ansiStyles.gray;
  Object.keys(ansiStyles).forEach(function (key) {
    ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
    ret[key] = {
      get: function () {
        return build(this._styles.concat(key));
      }
    };
  });
  return ret;
})();

var proto = defineProps(function colors() {}, styles);

function applyStyle() {
  var args = arguments;
  var argsLen = args.length;
  var str = argsLen !== 0 && String(arguments[0]);
  if (argsLen > 1) {
    for (var a = 1; a < argsLen; a++) {
      str += ' ' + args[a];
    }
  }

  if (!colors.enabled || !str) {
    return str;
  }

  var nestedStyles = this._styles;

  var i = nestedStyles.length;
  while (i--) {
    var code = ansiStyles[nestedStyles[i]];
    str = code.open + str.replace(code.closeRe, code.open) + code.close;
  }

  return str;
}

function applyTheme (theme) {
  for (var style in theme) {
    (function(style){
      colors[style] = function(str){
        if (typeof theme[style] === 'object'){
          var out = str;
          for (var i in theme[style]){
            out = colors[theme[style][i]](out);
          }
          return out;
        }
        return colors[theme[style]](str);
      };
    })(style)
  }
}

colors.setTheme = function (theme) {
  if (typeof theme === 'string') {
    try {
      colors.themes[theme] = require(theme);
      applyTheme(colors.themes[theme]);
      return colors.themes[theme];
    } catch (err) {
      console.log(err);
      return err;
    }
  } else {
    applyTheme(theme);
  }
};

function init() {
  var ret = {};
  Object.keys(styles).forEach(function (name) {
    ret[name] = {
      get: function () {
        return build([name]);
      }
    };
  });
  return ret;
}

var sequencer = function sequencer (map, str) {
  var exploded = str.split(""), i = 0;
  exploded = exploded.map(map);
  return exploded.join("");
};

// custom formatter methods
colors.trap = require('./custom/trap');
colors.zalgo = require('./custom/zalgo');

// maps
colors.maps = {};
colors.maps.america = require('./maps/america');
colors.maps.zebra = require('./maps/zebra');
colors.maps.rainbow = require('./maps/rainbow');
colors.maps.random = require('./maps/random')

for (var map in colors.maps) {
  (function(map){
    colors[map] = function (str) {
      return sequencer(colors.maps[map], str);
    }
  })(map)
}

defineProps(colors, init());
},{"./custom/trap":11,"./custom/zalgo":12,"./maps/america":15,"./maps/rainbow":16,"./maps/random":17,"./maps/zebra":18,"./styles":19,"./system/supports-colors":20}],11:[function(require,module,exports){
module['exports'] = function runTheTrap (text, options) {
  var result = "";
  text = text || "Run the trap, drop the bass";
  text = text.split('');
  var trap = {
    a: ["\u0040", "\u0104", "\u023a", "\u0245", "\u0394", "\u039b", "\u0414"],
    b: ["\u00df", "\u0181", "\u0243", "\u026e", "\u03b2", "\u0e3f"],
    c: ["\u00a9", "\u023b", "\u03fe"],
    d: ["\u00d0", "\u018a", "\u0500" , "\u0501" ,"\u0502", "\u0503"],
    e: ["\u00cb", "\u0115", "\u018e", "\u0258", "\u03a3", "\u03be", "\u04bc", "\u0a6c"],
    f: ["\u04fa"],
    g: ["\u0262"],
    h: ["\u0126", "\u0195", "\u04a2", "\u04ba", "\u04c7", "\u050a"],
    i: ["\u0f0f"],
    j: ["\u0134"],
    k: ["\u0138", "\u04a0", "\u04c3", "\u051e"],
    l: ["\u0139"],
    m: ["\u028d", "\u04cd", "\u04ce", "\u0520", "\u0521", "\u0d69"],
    n: ["\u00d1", "\u014b", "\u019d", "\u0376", "\u03a0", "\u048a"],
    o: ["\u00d8", "\u00f5", "\u00f8", "\u01fe", "\u0298", "\u047a", "\u05dd", "\u06dd", "\u0e4f"],
    p: ["\u01f7", "\u048e"],
    q: ["\u09cd"],
    r: ["\u00ae", "\u01a6", "\u0210", "\u024c", "\u0280", "\u042f"],
    s: ["\u00a7", "\u03de", "\u03df", "\u03e8"],
    t: ["\u0141", "\u0166", "\u0373"],
    u: ["\u01b1", "\u054d"],
    v: ["\u05d8"],
    w: ["\u0428", "\u0460", "\u047c", "\u0d70"],
    x: ["\u04b2", "\u04fe", "\u04fc", "\u04fd"],
    y: ["\u00a5", "\u04b0", "\u04cb"],
    z: ["\u01b5", "\u0240"]
  }
  text.forEach(function(c){
    c = c.toLowerCase();
    var chars = trap[c] || [" "];
    var rand = Math.floor(Math.random() * chars.length);
    if (typeof trap[c] !== "undefined") {
      result += trap[c][rand];
    } else {
      result += c;
    }
  });
  return result;

}

},{}],12:[function(require,module,exports){
// please no
module['exports'] = function zalgo(text, options) {
  text = text || "   he is here   ";
  var soul = {
    "up" : [
      '̍', '̎', '̄', '̅',
      '̿', '̑', '̆', '̐',
      '͒', '͗', '͑', '̇',
      '̈', '̊', '͂', '̓',
      '̈', '͊', '͋', '͌',
      '̃', '̂', '̌', '͐',
      '̀', '́', '̋', '̏',
      '̒', '̓', '̔', '̽',
      '̉', 'ͣ', 'ͤ', 'ͥ',
      'ͦ', 'ͧ', 'ͨ', 'ͩ',
      'ͪ', 'ͫ', 'ͬ', 'ͭ',
      'ͮ', 'ͯ', '̾', '͛',
      '͆', '̚'
    ],
    "down" : [
      '̖', '̗', '̘', '̙',
      '̜', '̝', '̞', '̟',
      '̠', '̤', '̥', '̦',
      '̩', '̪', '̫', '̬',
      '̭', '̮', '̯', '̰',
      '̱', '̲', '̳', '̹',
      '̺', '̻', '̼', 'ͅ',
      '͇', '͈', '͉', '͍',
      '͎', '͓', '͔', '͕',
      '͖', '͙', '͚', '̣'
    ],
    "mid" : [
      '̕', '̛', '̀', '́',
      '͘', '̡', '̢', '̧',
      '̨', '̴', '̵', '̶',
      '͜', '͝', '͞',
      '͟', '͠', '͢', '̸',
      '̷', '͡', ' ҉'
    ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    var r = Math.floor(Math.random() * range);
    return r;
  }

  function is_char(character) {
    var bool = false;
    all.filter(function (i) {
      bool = (i === character);
    });
    return bool;
  }
  

  function heComes(text, options) {
    var result = '', counts, l;
    options = options || {};
    options["up"] =   typeof options["up"]   !== 'undefined' ? options["up"]   : true;
    options["mid"] =  typeof options["mid"]  !== 'undefined' ? options["mid"]  : true;
    options["down"] = typeof options["down"] !== 'undefined' ? options["down"] : true;
    options["size"] = typeof options["size"] !== 'undefined' ? options["size"] : "maxi";
    text = text.split('');
    for (l in text) {
      if (is_char(l)) {
        continue;
      }
      result = result + text[l];
      counts = {"up" : 0, "down" : 0, "mid" : 0};
      switch (options.size) {
      case 'mini':
        counts.up = randomNumber(8);
        counts.mid = randomNumber(2);
        counts.down = randomNumber(8);
        break;
      case 'maxi':
        counts.up = randomNumber(16) + 3;
        counts.mid = randomNumber(4) + 1;
        counts.down = randomNumber(64) + 3;
        break;
      default:
        counts.up = randomNumber(8) + 1;
        counts.mid = randomNumber(6) / 2;
        counts.down = randomNumber(8) + 1;
        break;
      }

      var arr = ["up", "mid", "down"];
      for (var d in arr) {
        var index = arr[d];
        for (var i = 0 ; i <= counts[index]; i++) {
          if (options[index]) {
            result = result + soul[index][randomNumber(soul[index].length)];
          }
        }
      }
    }
    return result;
  }
  // don't summon him
  return heComes(text, options);
}

},{}],13:[function(require,module,exports){
var colors = require('./colors');

module['exports'] = function () {

  //
  // Extends prototype of native string object to allow for "foo".red syntax
  //
  var addProperty = function (color, func) {
    String.prototype.__defineGetter__(color, func);
  };

  var sequencer = function sequencer (map, str) {
      return function () {
        var exploded = this.split(""), i = 0;
        exploded = exploded.map(map);
        return exploded.join("");
      }
  };

  addProperty('strip', function () {
    return colors.strip(this);
  });

  addProperty('stripColors', function () {
    return colors.strip(this);
  });

  addProperty("trap", function(){
    return colors.trap(this);
  });

  addProperty("zalgo", function(){
    return colors.zalgo(this);
  });

  addProperty("zebra", function(){
    return colors.zebra(this);
  });

  addProperty("rainbow", function(){
    return colors.rainbow(this);
  });

  addProperty("random", function(){
    return colors.random(this);
  });

  addProperty("america", function(){
    return colors.america(this);
  });

  //
  // Iterate through all default styles and colors
  //
  var x = Object.keys(colors.styles);
  x.forEach(function (style) {
    addProperty(style, function () {
      return colors.stylize(this, style);
    });
  });

  function applyTheme(theme) {
    //
    // Remark: This is a list of methods that exist
    // on String that you should not overwrite.
    //
    var stringPrototypeBlacklist = [
      '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'charAt', 'constructor',
      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf', 'charCodeAt',
      'indexOf', 'lastIndexof', 'length', 'localeCompare', 'match', 'replace', 'search', 'slice', 'split', 'substring',
      'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight'
    ];

    Object.keys(theme).forEach(function (prop) {
      if (stringPrototypeBlacklist.indexOf(prop) !== -1) {
        console.log('warn: '.red + ('String.prototype' + prop).magenta + ' is probably something you don\'t want to override. Ignoring style name');
      }
      else {
        if (typeof(theme[prop]) === 'string') {
          colors[prop] = colors[theme[prop]];
          addProperty(prop, function () {
            return colors[theme[prop]](this);
          });
        }
        else {
          addProperty(prop, function () {
            var ret = this;
            for (var t = 0; t < theme[prop].length; t++) {
              ret = colors[theme[prop][t]](ret);
            }
            return ret;
          });
        }
      }
    });
  }

  colors.setTheme = function (theme) {
    if (typeof theme === 'string') {
      try {
        colors.themes[theme] = require(theme);
        applyTheme(colors.themes[theme]);
        return colors.themes[theme];
      } catch (err) {
        console.log(err);
        return err;
      }
    } else {
      applyTheme(theme);
    }
  };

};
},{"./colors":10}],14:[function(require,module,exports){
var colors = require('./colors');
module['exports'] = colors;

// Remark: By default, colors will add style properties to String.prototype
//
// If you don't wish to extend String.prototype you can do this instead and native String will not be touched
//
//   var colors = require('colors/safe);
//   colors.red("foo")
//
//
require('./extendStringPrototype')();
},{"./colors":10,"./extendStringPrototype":13}],15:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function() {
  return function (letter, i, exploded) {
    if(letter === " ") return letter;
    switch(i%3) {
      case 0: return colors.red(letter);
      case 1: return colors.white(letter)
      case 2: return colors.blue(letter)
    }
  }
})();
},{"../colors":10}],16:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
  return function (letter, i, exploded) {
    if (letter === " ") {
      return letter;
    } else {
      return colors[rainbowColors[i++ % rainbowColors.length]](letter);
    }
  };
})();


},{"../colors":10}],17:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 1))]](letter);
  };
})();
},{"../colors":10}],18:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = function (letter, i, exploded) {
  return i % 2 === 0 ? letter : colors.inverse(letter);
};
},{"../colors":10}],19:[function(require,module,exports){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var styles = {};
module['exports'] = styles;

var codes = {
  reset: [0, 0],

  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],

  // legacy styles for colors pre v1.0.0
  blackBG: [40, 49],
  redBG: [41, 49],
  greenBG: [42, 49],
  yellowBG: [43, 49],
  blueBG: [44, 49],
  magentaBG: [45, 49],
  cyanBG: [46, 49],
  whiteBG: [47, 49]

};

Object.keys(codes).forEach(function (key) {
  var val = codes[key];
  var style = styles[key] = [];
  style.open = '\u001b[' + val[0] + 'm';
  style.close = '\u001b[' + val[1] + 'm';
});
},{}],20:[function(require,module,exports){
(function (process){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var argv = process.argv;

module.exports = (function () {
  if (argv.indexOf('--no-color') !== -1 ||
    argv.indexOf('--color=false') !== -1) {
    return false;
  }

  if (argv.indexOf('--color') !== -1 ||
    argv.indexOf('--color=true') !== -1 ||
    argv.indexOf('--color=always') !== -1) {
    return true;
  }

  if (process.stdout && !process.stdout.isTTY) {
    return false;
  }

  if (process.platform === 'win32') {
    return true;
  }

  if ('COLORTERM' in process.env) {
    return true;
  }

  if (process.env.TERM === 'dumb') {
    return false;
  }

  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
    return true;
  }

  return false;
})();
}).call(this,require('_process'))
},{"_process":33}],21:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],22:[function(require,module,exports){
module.exports={
  "name": "easyrtc",
  "version": "1.0.15",
  "homepage": "http://www.easyrtc.com/",
  "author": {
    "name": "Priologic Software Inc.",
    "email": "info@priologic.com",
    "url": "http://priologic.com/"
  },
  "description": "EasyRTC enables quick development of webRTC",
  "contributors": [
    {
      "name": "Doug Pelton",
      "email": "doug@priologic.com"
    },
    {
      "name": "Rod Apeldoorn",
      "email": "rod.apeldoorn@priologic.com"
    },
    {
      "name": "Eric Davies",
      "email": "eric.davies@priologic.com"
    }
  ],
  "keywords": [
    "webRTC",
    "easy",
    "EasyRTC",
    "RTC",
    "server"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/priologic/easyrtc.git"
  },
  "bugs": {
    "url": "https://github.com/priologic/easyrtc/issues"
  },
  "main": "index",
  "dependencies": {
    "async": "0.2.x",
    "colors": "*",
    "underscore": "1.5.x"
  },
  "analyze": false,
  "license": "BSD2",
  "engines": {
    "node": ">=0.8"
  },
  "gitHead": "f57190db98d2a25dc63067878448feda1b0d847a",
  "_id": "easyrtc@1.0.15",
  "scripts": {},
  "_shasum": "9679baee4e6071027c93fd0f9bf710d1a3dfe412",
  "_from": "easyrtc@>=1.0.15 <1.1.0",
  "_npmVersion": "2.5.1",
  "_nodeVersion": "0.12.0",
  "_npmUser": {
    "name": "dryswabbie",
    "email": "rod@apeldoorn.ca"
  },
  "dist": {
    "shasum": "9679baee4e6071027c93fd0f9bf710d1a3dfe412",
    "tarball": "http://registry.npmjs.org/easyrtc/-/easyrtc-1.0.15.tgz"
  },
  "maintainers": [
    {
      "name": "dryswabbie",
      "email": "rod.apeldoorn@priologic.com"
    },
    {
      "name": "skedans",
      "email": "ops@skedans.com"
    }
  ],
  "directories": {},
  "_resolved": "https://registry.npmjs.org/easyrtc/-/easyrtc-1.0.15.tgz",
  "readme": "ERROR: No README data found!"
}

},{}],23:[function(require,module,exports){
var easyrtc = require("easyrtc"); 

module.exports = 'easyrtc';
},{"easyrtc":1}],24:[function(require,module,exports){

},{}],25:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":26,"ieee754":27,"is-array":28}],26:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],27:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],28:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],29:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],30:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],31:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],32:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],33:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],34:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],36:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],37:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":35,"./encode":36}],38:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":39}],39:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/



/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

},{"./_stream_readable":41,"./_stream_writable":43,"core-util-is":44,"inherits":30,"process-nextick-args":45}],40:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":42,"core-util-is":44,"inherits":30}],41:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/


/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events');

/*<replacement>*/
var EElistenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/



/*<replacement>*/
var Stream;
(function (){try{
  Stream = require('st' + 'ream');
}catch(_){}finally{
  if (!Stream)
    Stream = require('events').EventEmitter;
}}())
/*</replacement>*/

var Buffer = require('buffer').Buffer;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/



/*<replacement>*/
var debugUtil = require('util');
var debug;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function')
    this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function() {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}


// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (ret !== null)
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!(Buffer.isBuffer(chunk)) &&
      typeof chunk !== 'string' &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      processNextTick(emitReadable_, stream);
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    processNextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 &&
          state.pipes[0] === dest &&
          src.listenerCount('data') === 1 &&
          !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];


  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined))
      return;
    else if (!state.objectMode && (!chunk || !chunk.length))
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }; }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};


// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else if (list.length === 1)
      ret = list[0];
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"./_stream_duplex":39,"_process":33,"buffer":25,"core-util-is":44,"events":29,"inherits":30,"isarray":32,"process-nextick-args":45,"string_decoder/":57,"util":24}],42:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function')
      this._transform = options.transform;

    if (typeof options.flush === 'function')
      this._flush = options.flush;
  }

  this.once('prefinish', function() {
    if (typeof this._flush === 'function')
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":39,"core-util-is":44,"inherits":30}],43:[function(require,module,exports){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/


/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/



/*<replacement>*/
var Stream;
(function (){try{
  Stream = require('st' + 'ream');
}catch(_){}finally{
  if (!Stream)
    Stream = require('events').EventEmitter;
}}())
/*</replacement>*/

var Buffer = require('buffer').Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function (){try {
Object.defineProperty(WritableState.prototype, 'buffer', {
  get: internalUtil.deprecate(function() {
    return this.getBuffer();
  }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' +
     'instead.')
});
}catch(_){}}());


function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function')
      this._write = options.write;

    if (typeof options.writev === 'function')
      this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!(Buffer.isBuffer(chunk)) &&
      typeof chunk !== 'string' &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = nop;

  if (state.ended)
    writeAfterEnd(this, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.bufferedRequest)
      clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string')
    encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64',
'ucs2', 'ucs-2','utf16le', 'utf-16le', 'raw']
.indexOf((encoding + '').toLowerCase()) > -1))
    throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync)
    processNextTick(cb, er);
  else
    cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      processNextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var buffer = [];
    var cbs = [];
    while (entry) {
      cbs.push(entry.callback);
      buffer.push(entry);
      entry = entry.next;
    }

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    state.lastBufferedRequest = null;
    doWrite(stream, state, true, state.length, buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null)
      state.lastBufferedRequest = null;
  }
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined)
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(state) {
  return (state.ending &&
          state.length === 0 &&
          state.bufferedRequest === null &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      processNextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./_stream_duplex":39,"buffer":25,"core-util-is":44,"events":29,"inherits":30,"process-nextick-args":45,"util-deprecate":46}],44:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../insert-module-globals/node_modules/is-buffer/index.js")})
},{"../../../../insert-module-globals/node_modules/is-buffer/index.js":31}],45:[function(require,module,exports){
(function (process){
'use strict';
module.exports = nextTick;

function nextTick(fn) {
  var args = new Array(arguments.length - 1);
  var i = 0;
  while (i < args.length) {
    args[i++] = arguments[i];
  }
  process.nextTick(function afterTick() {
    fn.apply(null, args);
  });
}

}).call(this,require('_process'))
},{"_process":33}],46:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],47:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":40}],48:[function(require,module,exports){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":39,"./lib/_stream_passthrough.js":40,"./lib/_stream_readable.js":41,"./lib/_stream_transform.js":42,"./lib/_stream_writable.js":43}],49:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":42}],50:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":43}],51:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":29,"inherits":30,"readable-stream/duplex.js":38,"readable-stream/passthrough.js":47,"readable-stream/readable.js":48,"readable-stream/transform.js":49,"readable-stream/writable.js":50}],52:[function(require,module,exports){
var ClientRequest = require('./lib/request')
var extend = require('xtend')
var statusCodes = require('builtin-status-codes')
var url = require('url')

var http = exports

http.request = function (opts, cb) {
	if (typeof opts === 'string')
		opts = url.parse(opts)
	else
		opts = extend(opts)

	var protocol = opts.protocol || ''
	var host = opts.hostname || opts.host
	var port = opts.port
	var path = opts.path || '/'

	// Necessary for IPv6 addresses
	if (host && host.indexOf(':') !== -1)
		host = '[' + host + ']'

	// This may be a relative url. The browser should always be able to interpret it correctly.
	opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
	opts.method = (opts.method || 'GET').toUpperCase()
	opts.headers = opts.headers || {}

	// Also valid opts.auth, opts.mode

	var req = new ClientRequest(opts)
	if (cb)
		req.on('response', cb)
	return req
}

http.get = function get (opts, cb) {
	var req = http.request(opts, cb)
	req.end()
	return req
}

http.Agent = function () {}
http.Agent.defaultMaxSockets = 4

http.STATUS_CODES = statusCodes

http.METHODS = [
	'CHECKOUT',
	'CONNECT',
	'COPY',
	'DELETE',
	'GET',
	'HEAD',
	'LOCK',
	'M-SEARCH',
	'MERGE',
	'MKACTIVITY',
	'MKCOL',
	'MOVE',
	'NOTIFY',
	'OPTIONS',
	'PATCH',
	'POST',
	'PROPFIND',
	'PROPPATCH',
	'PURGE',
	'PUT',
	'REPORT',
	'SEARCH',
	'SUBSCRIBE',
	'TRACE',
	'UNLOCK',
	'UNSUBSCRIBE'
]
},{"./lib/request":54,"builtin-status-codes":56,"url":58,"xtend":62}],53:[function(require,module,exports){
(function (global){
exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableByteStream)

exports.blobConstructor = false
try {
	new Blob([new ArrayBuffer(1)])
	exports.blobConstructor = true
} catch (e) {}

var xhr = new global.XMLHttpRequest()
// If location.host is empty, e.g. if this page/worker was loaded
// from a Blob, then use example.com to avoid an error
xhr.open('GET', global.location.host ? '/' : 'https://example.com')

function checkTypeSupport (type) {
	try {
		xhr.responseType = type
		return xhr.responseType === type
	} catch (e) {}
	return false
}

// For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
// Safari 7.1 appears to have fixed this bug.
var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined'
var haveSlice = haveArrayBuffer && isFunction(global.ArrayBuffer.prototype.slice)

exports.arraybuffer = haveArrayBuffer && checkTypeSupport('arraybuffer')
// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream = !exports.fetch && haveSlice && checkTypeSupport('ms-stream')
exports.mozchunkedarraybuffer = !exports.fetch && haveArrayBuffer &&
	checkTypeSupport('moz-chunked-arraybuffer')
exports.overrideMimeType = isFunction(xhr.overrideMimeType)
exports.vbArray = isFunction(global.VBArray)

function isFunction (value) {
  return typeof value === 'function'
}

xhr = null // Help gc

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],54:[function(require,module,exports){
(function (process,global,Buffer){
// var Base64 = require('Base64')
var capability = require('./capability')
var inherits = require('inherits')
var response = require('./response')
var stream = require('stream')

var IncomingMessage = response.IncomingMessage
var rStates = response.readyStates

function decideMode (preferBinary) {
	if (capability.fetch) {
		return 'fetch'
	} else if (capability.mozchunkedarraybuffer) {
		return 'moz-chunked-arraybuffer'
	} else if (capability.msstream) {
		return 'ms-stream'
	} else if (capability.arraybuffer && preferBinary) {
		return 'arraybuffer'
	} else if (capability.vbArray && preferBinary) {
		return 'text:vbarray'
	} else {
		return 'text'
	}
}

var ClientRequest = module.exports = function (opts) {
	var self = this
	stream.Writable.call(self)

	self._opts = opts
	self._body = []
	self._headers = {}
	if (opts.auth)
		self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'))
	Object.keys(opts.headers).forEach(function (name) {
		self.setHeader(name, opts.headers[name])
	})

	var preferBinary
	if (opts.mode === 'prefer-streaming') {
		// If streaming is a high priority but binary compatibility and
		// the accuracy of the 'content-type' header aren't
		preferBinary = false
	} else if (opts.mode === 'allow-wrong-content-type') {
		// If streaming is more important than preserving the 'content-type' header
		preferBinary = !capability.overrideMimeType
	} else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
		// Use binary if text streaming may corrupt data or the content-type header, or for speed
		preferBinary = true
	} else {
		throw new Error('Invalid value for opts.mode')
	}
	self._mode = decideMode(preferBinary)

	self.on('finish', function () {
		self._onFinish()
	})
}

inherits(ClientRequest, stream.Writable)

ClientRequest.prototype.setHeader = function (name, value) {
	var self = this
	var lowerName = name.toLowerCase()
	// This check is not necessary, but it prevents warnings from browsers about setting unsafe
	// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
	// http-browserify did it, so I will too.
	if (unsafeHeaders.indexOf(lowerName) !== -1)
		return

	self._headers[lowerName] = {
		name: name,
		value: value
	}
}

ClientRequest.prototype.getHeader = function (name) {
	var self = this
	return self._headers[name.toLowerCase()].value
}

ClientRequest.prototype.removeHeader = function (name) {
	var self = this
	delete self._headers[name.toLowerCase()]
}

ClientRequest.prototype._onFinish = function () {
	var self = this

	if (self._destroyed)
		return
	var opts = self._opts

	var headersObj = self._headers
	var body
	if (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH') {
		if (capability.blobConstructor) {
			body = new global.Blob(self._body.map(function (buffer) {
				return buffer.toArrayBuffer()
			}), {
				type: (headersObj['content-type'] || {}).value || ''
			})
		} else {
			// get utf8 string
			body = Buffer.concat(self._body).toString()
		}
	}

	if (self._mode === 'fetch') {
		var headers = Object.keys(headersObj).map(function (name) {
			return [headersObj[name].name, headersObj[name].value]
		})

		global.fetch(self._opts.url, {
			method: self._opts.method,
			headers: headers,
			body: body,
			mode: 'cors',
			credentials: opts.withCredentials ? 'include' : 'same-origin'
		}).then(function (response) {
			self._fetchResponse = response
			self._connect()
		}, function (reason) {
			self.emit('error', reason)
		})
	} else {
		var xhr = self._xhr = new global.XMLHttpRequest()
		try {
			xhr.open(self._opts.method, self._opts.url, true)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}

		// Can't set responseType on really old browsers
		if ('responseType' in xhr)
			xhr.responseType = self._mode.split(':')[0]

		if ('withCredentials' in xhr)
			xhr.withCredentials = !!opts.withCredentials

		if (self._mode === 'text' && 'overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain; charset=x-user-defined')

		Object.keys(headersObj).forEach(function (name) {
			xhr.setRequestHeader(headersObj[name].name, headersObj[name].value)
		})

		self._response = null
		xhr.onreadystatechange = function () {
			switch (xhr.readyState) {
				case rStates.LOADING:
				case rStates.DONE:
					self._onXHRProgress()
					break
			}
		}
		// Necessary for streaming in Firefox, since xhr.response is ONLY defined
		// in onprogress, not in onreadystatechange with xhr.readyState = 3
		if (self._mode === 'moz-chunked-arraybuffer') {
			xhr.onprogress = function () {
				self._onXHRProgress()
			}
		}

		xhr.onerror = function () {
			if (self._destroyed)
				return
			self.emit('error', new Error('XHR error'))
		}

		try {
			xhr.send(body)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}
	}
}

/**
 * Checks if xhr.status is readable. Even though the spec says it should
 * be available in readyState 3, accessing it throws an exception in IE8
 */
function statusValid (xhr) {
	try {
		return (xhr.status !== null)
	} catch (e) {
		return false
	}
}

ClientRequest.prototype._onXHRProgress = function () {
	var self = this

	if (!statusValid(self._xhr) || self._destroyed)
		return

	if (!self._response)
		self._connect()

	self._response._onXHRProgress()
}

ClientRequest.prototype._connect = function () {
	var self = this

	if (self._destroyed)
		return

	self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode)
	self.emit('response', self._response)
}

ClientRequest.prototype._write = function (chunk, encoding, cb) {
	var self = this

	self._body.push(chunk)
	cb()
}

ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
	var self = this
	self._destroyed = true
	if (self._response)
		self._response._destroyed = true
	if (self._xhr)
		self._xhr.abort()
	// Currently, there isn't a way to truly abort a fetch.
	// If you like bikeshedding, see https://github.com/whatwg/fetch/issues/27
}

ClientRequest.prototype.end = function (data, encoding, cb) {
	var self = this
	if (typeof data === 'function') {
		cb = data
		data = undefined
	}

	stream.Writable.prototype.end.call(self, data, encoding, cb)
}

ClientRequest.prototype.flushHeaders = function () {}
ClientRequest.prototype.setTimeout = function () {}
ClientRequest.prototype.setNoDelay = function () {}
ClientRequest.prototype.setSocketKeepAlive = function () {}

// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders = [
	'accept-charset',
	'accept-encoding',
	'access-control-request-headers',
	'access-control-request-method',
	'connection',
	'content-length',
	'cookie',
	'cookie2',
	'date',
	'dnt',
	'expect',
	'host',
	'keep-alive',
	'origin',
	'referer',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'user-agent',
	'via'
]

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":53,"./response":55,"_process":33,"buffer":25,"inherits":30,"stream":51}],55:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var stream = require('stream')

var rStates = exports.readyStates = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
}

var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode) {
	var self = this
	stream.Readable.call(self)

	self._mode = mode
	self.headers = {}
	self.rawHeaders = []
	self.trailers = {}
	self.rawTrailers = []

	// Fake the 'close' event, but only once 'end' fires
	self.on('end', function () {
		// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
		process.nextTick(function () {
			self.emit('close')
		})
	})

	if (mode === 'fetch') {
		self._fetchResponse = response

		self.statusCode = response.status
		self.statusMessage = response.statusText
		// backwards compatible version of for (<item> of <iterable>):
		// for (var <item>,_i,_it = <iterable>[Symbol.iterator](); <item> = (_i = _it.next()).value,!_i.done;)
		for (var header, _i, _it = response.headers[Symbol.iterator](); header = (_i = _it.next()).value, !_i.done;) {
			self.headers[header[0].toLowerCase()] = header[1]
			self.rawHeaders.push(header[0], header[1])
		}

		// TODO: this doesn't respect backpressure. Once WritableStream is available, this can be fixed
		var reader = response.body.getReader()
		function read () {
			reader.read().then(function (result) {
				if (self._destroyed)
					return
				if (result.done) {
					self.push(null)
					return
				}
				self.push(new Buffer(result.value))
				read()
			})
		}
		read()

	} else {
		self._xhr = xhr
		self._pos = 0

		self.statusCode = xhr.status
		self.statusMessage = xhr.statusText
		var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
		headers.forEach(function (header) {
			var matches = header.match(/^([^:]+):\s*(.*)/)
			if (matches) {
				var key = matches[1].toLowerCase()
				if (self.headers[key] !== undefined)
					self.headers[key] += ', ' + matches[2]
				else
					self.headers[key] = matches[2]
				self.rawHeaders.push(matches[1], matches[2])
			}
		})

		self._charset = 'x-user-defined'
		if (!capability.overrideMimeType) {
			var mimeType = self.rawHeaders['mime-type']
			if (mimeType) {
				var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
				if (charsetMatch) {
					self._charset = charsetMatch[1].toLowerCase()
				}
			}
			if (!self._charset)
				self._charset = 'utf-8' // best guess
		}
	}
}

inherits(IncomingMessage, stream.Readable)

IncomingMessage.prototype._read = function () {}

IncomingMessage.prototype._onXHRProgress = function () {
	var self = this

	var xhr = self._xhr

	var response = null
	switch (self._mode) {
		case 'text:vbarray': // For IE9
			if (xhr.readyState !== rStates.DONE)
				break
			try {
				// This fails in IE8
				response = new global.VBArray(xhr.responseBody).toArray()
			} catch (e) {}
			if (response !== null) {
				self.push(new Buffer(response))
				break
			}
			// Falls through in IE8	
		case 'text':
			try { // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
				response = xhr.responseText
			} catch (e) {
				self._mode = 'text:vbarray'
				break
			}
			if (response.length > self._pos) {
				var newData = response.substr(self._pos)
				if (self._charset === 'x-user-defined') {
					var buffer = new Buffer(newData.length)
					for (var i = 0; i < newData.length; i++)
						buffer[i] = newData.charCodeAt(i) & 0xff

					self.push(buffer)
				} else {
					self.push(newData, self._charset)
				}
				self._pos = response.length
			}
			break
		case 'arraybuffer':
			if (xhr.readyState !== rStates.DONE)
				break
			response = xhr.response
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'moz-chunked-arraybuffer': // take whole
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING || !response)
				break
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'ms-stream':
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING)
				break
			var reader = new global.MSStreamReader()
			reader.onprogress = function () {
				if (reader.result.byteLength > self._pos) {
					self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))))
					self._pos = reader.result.byteLength
				}
			}
			reader.onload = function () {
				self.push(null)
			}
			// reader.onerror = ??? // TODO: this
			reader.readAsArrayBuffer(response)
			break
	}

	// The ms-stream case handles end separately in reader.onload()
	if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
		self.push(null)
	}
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":53,"_process":33,"buffer":25,"inherits":30,"stream":51}],56:[function(require,module,exports){
module.exports = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Moved Temporarily",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Time-out",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Request Entity Too Large",
  "414": "Request-URI Too Large",
  "415": "Unsupported Media Type",
  "416": "Requested Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a teapot",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Time-out",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
}

},{}],57:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":25}],58:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":59,"punycode":34,"querystring":37}],59:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],60:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],61:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":60,"_process":33,"inherits":30}],62:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[23]);
