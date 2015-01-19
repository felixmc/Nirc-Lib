var EOL = "\r\n";

var net  = require("net");
var util = require("util");

var EventEmitter = require('events').EventEmitter;

function parseUsername(parts) {
	return parts[0].split("!")[0].slice(1);
};

function parseRoom(parts, i) {
	return parts[i || 2].trim().slice(1);
}

function IrcClient(options) {
	this.config = options;
	this.connection = net.connect(options.port, options.host);
	this.connection.setEncoding("utf-8");
	
	this.rooms = []; 

	var self = this;

	this.connection.on("connect", function() {
		self.login(options.nick, options.username || options.nick, options.realname);
	});

	this.connection.on("data", function(data) {
		data.split("\n").forEach(function(dataPart) {
			if (dataPart != "")
				self.parseInput(dataPart);
		});
	});
}

util.inherits(IrcClient, EventEmitter);

IrcClient.prototype.parseInput = function(data) {
	var self = this;
	
	self.emit("data", data);
	
	var parts = data.split(" ");

	if (parts[0] == "PING") {
		self.pong(parts.slice(1).join(" "));
	} else if (parts[1] == "376") {
		self.emit("connected");
	} else if (parts[1] == "JOIN") {
		self.emit("join", parseRoom(parts).slice(1), parseUsername(parts));
	} else if (parts[1] == "QUIT") { 
		self.emit("quit", parseUsername(parts));
	} else if (parts[1] == "PART") { 
		self.emit("part", parseRoom(parts), parseUsername(parts));
	} else if (parts[1] == "332") {
		self.emit("topic", parseRoom(parts, 3), data.slice(data.slice(1).indexOf(":") + 2).trim());
	} else if (parts[1] == "353") {
		self.emit("names", parseRoom(parts, 4), data.split(":")[2].trim().split(" "));
	} else if (parts[1] == "366") {
		self.emit("endOfNames", parseRoom(parts, 3));
	} else if (parts[1] == "PRIVMSG") {
		self.emit("message", parseRoom(parts), parseUsername(parts), data.slice(data.slice(1).indexOf(":") + 2).trim());
	} else {
		// console.log("unknown: " + parts);
	}
};

IrcClient.prototype.login = function(nick, user, realname) {
	this.connection.write("NICK " + nick + EOL);
	this.connection.write("USER " + user + " 8 * :" + realname + EOL);
};

IrcClient.prototype.pong = function(data) {
	this.connection.write("PONG " + data + EOL);
};

IrcClient.prototype.join = function(room) {
	this.connection.write("JOIN #" + room + EOL);
	this.rooms.push(room);
};

IrcClient.prototype.leave = function(room) {
	// rooms.push(room);
};

IrcClient.prototype.message = function(room, text) {
	this.connection.write("PRIVMSG #" + room + " :" + text + EOL);
};

module.exports = IrcClient;
