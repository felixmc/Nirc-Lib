var EOL = "\r\n";

var net  = require("net");
var util = require("util");

var EventEmitter = require('events').EventEmitter;

function IrcClient(options) {
	this.connection = net.connect(options.port, options.host);
	this.connection.setEncoding("utf-8");
	
	this.rooms = []; 

	var self = this;

	this.connection.on("connect", function() {
		self.login(options.nick, options.username || options.nick, options.realname);
	});

	this.connection.on("data", function(data) {
		this.emit("data", data);
		
		var parts = data.split(" ");
		
		console.log(data);
		
		if (parts[0] == "PING") {
			self.pong(parts.slice(1).join(" "));
		} else if (parts[1] == "PRIVMSG") {
			self.emit("message", parts[2].slice(1), parts[0].split("!")[0].slice(1), data.slice(data.slice(1).indexOf(":") + 2).trim());
		}

	});
}

util.inherits(IrcClient, EventEmitter);

IrcClient.prototype.login = function(nick, user, realname) {
	this.connection.write("NICK " + nick + EOL);
	this.connection.write("USER " + user + " 8 * :" + realname + EOL);
	this.emit("connected");
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
