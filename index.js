const io = require('socket.io')(8081);
const WebSocket = require('ws');
const Socks = require('socks');
const fs = require('fs');
require("colour");
var serverIP = "";
var x, y = 0;
var count = 0;
var botCount = 0;
var bots = [];
var sendCountUpdate = function() {};
let proxies = fs.readFileSync("proxies.txt", "utf8").split("\n").filter(function(a) {
    return !!a;
});
let baseOpt = {
  headers: {
    'origin': 'http://cellcraft.io/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
  }
};

function Bot(id) {
  this.id = id;
  this.opt = baseOpt;
  this.connect();
}

// function sendCountUpdate() {
//  if (!socket) return;
//  socket.emit("count", botCount);
// }

function start() {
    for (var i in bots)
    bots[i].disconnect();
    setInterval(function() {
        i++;
        bots.push(new Bot(i));
    },200);
    for (var i in bots)
        bots[i].connect();
}

function prepareData(a) {
    return new DataView(new ArrayBuffer(a));
}

function createAgent() {
    var proxy = proxies[~~(Math.random() * proxies.length)].split(':');
    return new Socks.Agent({
        proxy: {
            ipaddress: proxy[0],
            port: parseInt(proxy[1]),
            type: parseInt(proxy[2]) || 5
        }
    });
}

Bot.prototype = {
    hasConnected: false,
    send: function(buf) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(buf);
    },
    
    connect() {
    this.opt.agent = createAgent(this.id);
    this.ws = new WebSocket(serverIP, this.opt);
    this.ws.binaryType = 'nodebuffer';
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  },
  
  disconnect() {
      if (this.ws) this.ws.close();
  },
  
  spawn(name) {
      setInterval(function() {
      var msg = prepareData(1 + 2 * (name.length + 1));
      msg.setUint8(0, 0);
      for(var i = 0; i < name.length; ++i) msg.setUint16(1 + 2 * i, name.charCodeAt(i), true);
      this.send(msg);
      }, 1000);
      
  },
  
  moveTo() {
    var buf = new Buffer(13);
    buf.writeUInt8(16, 0);
    buf.writeInt32LE(x, 1);
    buf.writeInt32LE(y, 5);
    buf.writeInt32LE(0, 9);
    this.send(buf);
  },
  
  onOpen() {
            let client = this;
            this.send(new Buffer([254, 5, 0, 0, 0]));
            this.send(new Buffer([255, 50, 137, 112, 79]));
            this.send(new Buffer([90, 51, 24, 34, 131]));
            this.send(new Buffer([42]));
            setInterval(function() {
            client.send(new Buffer([0, 59, 0, 0, 0, 0]));
            }, 3000);
            setInterval(function() {
            client.moveTo();
            }, 100);
            this.hasConnected = true;
            count++;
            sendCountUpdate();
    },
    
    onClose() {
        if (this.hasConnected) {
            count--;
            sendCountUpdate();
        }
        this.hasConnected = false;
        if (count < botCount)
            this.connect();
    },
    
    onError() {
        setTimeout(function() {
        this.connect.bind(this);
        }.bind(this), 500);
    },
    
    split() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    	  return;
        }
	  	var buf = new Buffer([17]);
        this.send(buf);
        var buf2 = new Buffer([56]);
        this.send(buf2);
    },
    
    eject() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        	return;
        }
    	var buf = new Buffer([21]);
        this.send(buf);
        var buf2 = new Buffer([36]);
        this.send(buf2);
        var buf3 = new Buffer([57]);
        this.send(buf3);
        var buf4 = new Buffer([22]);
        this.send(buf4);
	   }
    },
    
    io.on('connection', function(socket) {
    console.log(('User Connected').cyan);
    sendCountUpdate = function() {
        socket.emit("botCount", count);
    };
    
    socket.on('start', function(data) {
        let origin = null;
        serverIP = data.ip;
        origin = data.origin;
        start();
        console.log(('[ServerIP]: ' + serverIP).strikethrough);
        console.log(('[Clone]: ' + origin).strikethrough);
        console.log(('Bots Connected!').green);
    });
    
    socket.on('movement', function(data) {
        x = data.x;
        y = data.y;
    });
    
     socket.on('split', function() {
        for (var i in bots)
            bots[i].split();
    });
    socket.on('eject', function() {
		for (var i in bots)
            bots[i].eject();
    });
});
console.log(('Server Started').green);
