const { getUserInfo } = require("@replit/repl-auth")
const express = require('express');
const ejs = require('ejs');
var seedrandom = require('seedrandom');
const app = express();
let colors = require('./colors.json');
require('express-ws')(app);
let crypto = require('crypto');
const createDOMPurify = require('dompurify');
let sanitize = require('sanitize-html');
const { JSDOM } = require('jsdom');
const hljs = require('highlight.js');
let marked = require('marked').marked;
let lib = require('./lib.js');
var mysql = require('mysql');
const fetch = require('@replit/node-fetch');

// var sqlCon = mysql.createConnection({
//   host: process.env.SQLHOST,
//   user: process.env.SQLUSER,
//   password: process.env.SQLPWD,
// 	database: "repl_chatty",
//   port: 3306
// });

// sqlCon.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// sqlCon.query('SELECT * from `messages`', (err, r) => {
// 	console.log(r);
// })

// (async() => {
// 	const q = await sqlCon.query('SELECT * from `messages`');
// 	console.log(q);
// })();

const CHATTY_LOCK = false;
const admins = ["repx", "ktat", "EnZon3", "bddy"];
// other people that we can trust to help test the server
const allowedAccounts = ["kat-", "skywarspro15", "datkat21", "deemdagreat2007"];

marked.use({
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartypants: false,
  xhtml: false,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
});

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

let genToken = () =>
  crypto.randomBytes(16).toString('hex').substring(0, 32);

const CHATTY_EPOCH = 1673651779353;

let genId = () => {
  // Generate a random number
  let currentTime = Date.now() - CHATTY_EPOCH;
  return (currentTime + '' + Math.floor(Math.random() * 1000)).toString();
};

if (CHATTY_LOCK === true) {
  app.use(['/app', '/c/:room'], (req, res, next) => {
    const u = getUserInfo(req);

    if (u === null) return res.render('index-new', {
      message: 'Invalid login. Please log in with a valid admin account to continue'
    })
    if (!admins.includes(u.name) && !allowedAccounts.includes(u.name)) return res.render('index-new', {
      message: `Sorry, but <i>${u.name}</i> does not have access to Chatty right now.<br>It is currently undergoing maintenance.`
    })

    next();
  });
}

app.use('/*',(req,res,next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
})

app.use(['/app', '/c/:room'], (req, res, next) => {
  const u = getUserInfo(req);

  if (u === null) return res.render('index-new', {
    message: 'Invalid login. Please log in with a valid admin account to continue'
  })

  // if (u.name === 'Maps-API' || u.name === 'GWBJFC' || u.name == "LuisAFK" || u.name == "ae0") return res.render('index-new', {
  //   message: 'Invalid login. Please log in with a valid admin account to continue'
  // })

  next();
});

app.get('/reauth', (req, res) => {
  res.render('index-new', {
    message: 'Use this page to fix your logins if they are not working correctly.'
  })
})

app.get('/', (req, res) => {
  const u = getUserInfo(req);
  if (u === null) {
    res.render('index-new', { message: null });
  } else {
    res.redirect('/app');
  }
});

app.get("/invite/:link", (req, res) => {
  const u = getUserInfo(req)
  if (u === null) {
    res.render('index-new', {
      message: 'Log in to continue to <code>' + encodeURIComponent(req.params.link) + '</code>'
    })
  } else {
    res.redirect('/app/?room=' + req.params.link);
  }
})

app.get('/app', (_, res) => {
  const u = getUserInfo(_);
  if (u == null) {
    return res.redirect('/');
  }

  res.render('chat-new');
});

function genUserProfileIcon(color) {
  return `<div style="display:inline-flex;justify-content: center;align-items:center;color:${color.t + (
    color.t[2] === '0'
      ? '6'
      : 'a'
  )
    };max-width:48px;max-height:48px;width:100%;height:100%;background-color:${color.c};    position: relative;
    border-radius: 50%;
    border: 4px solid ${color.t}2;
    margin: 0;
    padding: 0;">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </div>`
}

app.get('/colors', (req, res) => {
  let colorString = '';
  for (let i = 0; i < colors.length; i++) {
    colorString += '<img src="/avatars/' + i + '.svg">';
  }
  res.send(colorString);
});

app.ws('/admin', (ws, req) => {
  const user = getUserInfo(req);
  if (!user) return ws.send("Unauthorized")
  if (!admins.include(user.name)) return ws.send("Unauthorized")

  let permissionLevel = ['Head', 'Moderator'] //is this needed?

  // admin websocket stuff
  ws.onmessage = ({ data }) => {
    switch (data.type) {
      case 'banUser':
        user = data.user;
        console.log(user)
        break;
    }
  }
});

app.get('/colors/:name', (req, res) => {
  var rng = seedrandom('chatty-rng-name-' + req.params.name);
  let random = Math.floor(rng() * colors.length);
  var htmlstr = `<link rel="stylesheet" href="/style.css">
  <div class="message" style="display:inline-grid;height:max-content;width:max-content">
        <div class="avatar">
        ${genUserProfileIcon(colors[random])}
        </div>
        <div class="meta">
          <div class="name">${encodeURIComponent(req.params.name)}</div>
          <div class="time">4:44 PM</div>
        </div>
        <div class="content">Hi! Chatty is currently not available for use. Thank you!</div>
      </div>`;
  res.status(200).send(htmlstr);
})

app.get('/app/:room', (req, res) => {
  const user = getUserInfo(req);
  if (user == null) {
    return res.redirect('/');
  }


  res.render('chat-new');
});

app.get('/img/*', (req, res) => {
  const user = getUserInfo(req);
  if (user == null) return res.status(401).send('No')
  res.send(req.url.slice(5));
})

app.use('/', express.static('public'));

app.get('/c/:room', (req, res) => {
  res.render('chat');
})

app.ws('/c/:room', (ws, req) => {
  let sockId;

  const user = getUserInfo(req);
  if (user == null) {
    ws.send('{"error":true,"message":"Unauthorized"}')
    return ws.close();
  } else {
    ws.user = { name: user.name, id: user.id, profileImage: user.profileImage, isTyping: false }; // minimal replit account details
    // console.log(ws.user);

    if (user.profileImage === undefined) {
      console.log('oops');
    }

    // Setup a new token for the user
    ws.token = genToken();
    ws.tokenId = lib.appendUserToken(ws.user.id, ws.token);

    sockId = lib.appendSock(req.params.room, ws);

    console.log(ws.user.name, 'connected with socket id', sockId);


    ws.send(JSON.stringify({ type: 'message', you: { user, token: ws.token } }));
  }

  ws.onmessage = m => {
    let d = lib.jsonTryParse(m.data);
    if (d === false) return console.log('Failed to parse message', m.data);

    if (!d.token)
      return ws.send(JSON.stringify({ error: true, message: "Malformed request, please include token", code: 401 }));

    let isValid = lib.getUserTokens(ws.user.id).find(x => x === d.token) === undefined ? false : true;

    if (!isValid) return ws.send(JSON.stringify({ error: true, message: "Expired or invalid token", code: 402 }));

    if (!d.type) return ws.send(JSON.stringify({ error: true, message: "Malformed request, please check message type", code: 403 }));

    switch (d.type) {
      case 'heartbeat':
        let husersInRoom = lib.getUsers(req.params.room);
        ws.send(JSON.stringify({
          type: 'hbr', message: husersInRoom.filter(m => m !== null).map(m => {
            if (m.user) return m.user
          }), isServer: true
        }));
        break;
      case 'typing':
        if (typeof d.isTyping !== 'boolean') return ws.send(JSON.stringify({ type: "announce", announce: { message: 'Unknonwn Error' }, type: "error" }));
        ws.user.isTyping = d.isTyping;
        let usersForTyping = lib.getUsers(req.params.room).filter(u => u !== null);
        usersForTyping.forEach(u => { u.send(JSON.stringify({ type: 'typing', who: ws.user, state: ws.user.isTyping })) });
        break;
      case 'sendMessage':
        if (typeof d.data !== 'string') return ws.send(JSON.stringify({ type: "announce", announce: { message: 'Failed to send your message.' }, type: "error" }));
        var msgToParse = d.data.substring(0, 8000).replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
        if (msgToParse === '') return ws.send(JSON.stringify({ type: "message", who: { name: 'Chatty', profileImage: 'https://bddy.lol/favicon.png' }, message: 'Failed to send your message.' }));
        let users = lib.getUsers(req.params.room).filter(u => u !== null);

        let msg = parseMessage(msgToParse, users, ws.user);
        if (msg === "\n" || msg === false) return ws.send(JSON.stringify({ type: "message", who: { name: 'Chatty (System)', profileImage: '/avatars/chatty.svg' }, message: `Sorry, I didn't catch your message. It was probably empty.<br><span class="text-xs text-slate-400">(Only <mention class="rounded-full px-2 py-1 bg-slate-800 bg-blue-500 hover:bg-blue-700 text-slate-200">@${ws.user.name}</mention> can see this.)</span>`, mentions: [ws.user.name] }));
        let srcMessage = msg.srcMessage;

        if (srcMessage.startsWith("/")) {
          let parsedCommand = srcMessage.substring(1);
          parsedCommand = parsedCommand.split(' ');
          let botName = parsedCommand[0];
          let command = parsedCommand.slice(1);

          // temporary, will be moved into if statement
          var userCheck = users.filter(u => u.bot && u.bot.name && u.bot.name.toLowerCase() === botName.toLowerCase());

          if (userCheck.length > 0) {
            userCheck.forEach(b => {
              b.send(JSON.stringify({
                type: 'slash',
                command,
                who: ws.user, id: genId(),
              }))
            })
            // console.log(users.map(m => m.user.name))
          }
        }
        users.forEach(u => { u.send(JSON.stringify(msg)) })
        break;
      case 'onlineUsers':
        let usersInRoom = lib.getUsers(req.params.room);
        ws.send(JSON.stringify({
          type: 'users',
          message: usersInRoom
            .filter(m => m !== null)
            .map(m => {
              if (m === null) return null
              if (m.user && m.user.name) return m.user.name;
              else return null
            }),
          isServer: true
        }));
        break;
    }
  }
  ws.onerror = _ => {
    console.log('oops socket error');
  }
  ws.onclose = _ => {
    console.log(ws.user.name, 'disconnected having socket id', sockId);
    // console.log(socks['main'].map((m, i) => {
    //   if (m === null) return i
    //     if (m.user && m.user.name) return m.user.name;
    //   else return null
    // }));
    lib.remSock(req.params.room, sockId);
    lib.remUserToken(ws.user.id, ws.tokenId);
  };
});

// Bot
app.ws('/b/:room', (ws, req) => {
  let sockId;
  // Setup a new token for the user
  ws.token = genToken();

  ws.bot = { hasInitialized: false };

  // append,     to this room     this socket
  sockId = lib.appendSock(req.params.room, ws);

  ws.user = { name: 'Unknown Bot', id: -1, isBot: true, profileImage: 'https://chatty.ktat.repl.co/avatars/10.svg' };

  console.log('A bot connected with socket id', sockId);


  ws.send(JSON.stringify({ token: ws.token }));

  ws.onmessage = m => {
    let d = lib.jsonTryParse(m.data);
    if (d === false) return console.log('Failed to parse message', m.data);

    if (ws.bot.hasInitialized === false && !d.bot)
      return ws.send(JSON.stringify({ error: true, code: "NO_BOT_DATA" }));

    if (!d.wssMessageData)
      return ws.send(JSON.stringify({ error: true, code: "NO_MESSAGE_DATA" }));

    if (!d.wssMessageData.token)
      return ws.send(JSON.stringify({ error: true, code: "NO_TOKEN" }));

    let isValid = ws.token === d.wssMessageData.token ? true : false;

    if (!isValid) return ws.send(JSON.stringify({ error: true, code: 'INVALID_TOKEN' }));

    if (!d.type) return ws.send(JSON.stringify({ error: true, code: 'BAD_MESSAGE_TYPE' }));

    switch (d.type) {
      case 'heartbeat':
        let husersInRoom = lib.getUsers(req.params.room);
        // console.log(d?.bot?.name || 'no bot name');
        ws.send(JSON.stringify({
          type: 'hbr', message: husersInRoom.filter(m => m !== null).map(m => {
            if (m.user) return m.user;
            else if (m.bot) return m.bot
          }), isServer: true
        }));
        break;
      case 'bot':
        if (ws.bot.hasInitialized === false) {
          ws.bot.name = d.bot?.name.substring(0, 16) || 'Unknown Bot';
          var rng = seedrandom('chatty-rng-name-' + req.params.name);
          let random = Math.floor(rng() * colors.length);
          if (d.bot?.image !== null) {
            ws.user.profileImage = d.bot?.image;
          } else {
            ws.user.profileImage = `/avatars/${random}.svg`;
          }
          ws.bot.profileImage = ws.user.profileImage;
          ws.bot.info = d.bot?.info.substring(0, 512) || '<i>Bot description not set.</i>';
          ws.bot.hasInitialized = true;
          ws.user.info = ws.bot.info;
          ws.user.name = ws.bot.name;
          console.log(`(debug) bot ${ws.bot.name} initialized successfully`)
        } else {
          console.log(d.data)
        }
        break;
      case 'sendMessage':
        if (typeof d.data !== 'string') return ws.send('{"error":"INVALID_MESSAGE_BODY"}');
        const MAX_MSG_LENGTH = ws.bot.name === 'Helper' ? 128_000 : 8000;
        var msgToParse = d.data.substring(0, MAX_MSG_LENGTH).replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
        if (msgToParse === '') return ws.send(JSON.stringify({ type: "message", who: { name: 'Chatty', profileImage: 'https://bddy.lol/favicon.png' }, message: 'Failed to send your message.' }));
        let users = lib.getUsers(req.params.room).filter(u => u !== null);
        let msg = parseMessage(msgToParse, users, ws.user);
        if (msg === false) return ws.send('{"error":"INVALID_MESSAGE"}');
        users.filter(u => u !== null).forEach(u => { u.send(JSON.stringify(msg)) })
        break;
      case 'onlineUsers':
        let usersInRoom = lib.getUsers(req.params.room);
        ws.send(JSON.stringify({
          type: 'users',
          message: usersInRoom
            .filter(m => m !== null)
            .map(m => {
              if (m === null) return null
              if (m.user && m.user.name) return m.user.name;
              else return null
            }),
          isServer: true
        }));
        break;
    }
  }

  ws.onclose = _ => {
    console.log('A bot disconnected having socket id', sockId);
    // console.log(socks['main'].map((m, i) => {
    //   if (m === null) return i
    //     if (m.user && m.user.name) return m.user.name;
    //   else return null
    // }));
    lib.remSock(req.params.room, sockId);
  };
})

function broadcastSocketLeave(room, data) {
  let husersInRoom = lib.getUsers(room);
  console.log(d?.bot?.name || 'no bot name');
  ws.send(JSON.stringify({
    type: 'hbr', message: husersInRoom.filter(m => m !== null).map(m => {
      if (m.user) return m.user
    }), isServer: true
  }));
}

function parseMessage(msgToParse, users, user) {
  msgToParse = msgToParse.trim();
  if (DOMPurify.sanitize(msgToParse) === '') return false;
  let safe = sanitize(DOMPurify.sanitize(marked.parse(msgToParse)), {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'em', 'strong', 'a', 'table', 'tr', 'td', 'th', 'li', 'ul', 'blockquote', 'code', 'pre', 'br', 'span'],
    // allowedClasses: ['']
  });

  try {
    let mentionRegex = /@([a-zA-Z0-9-]+)/g;
    const mentions = safe.match(mentionRegex);  

    var validMentions = [];

    if (mentions !== null && mentions.length > 0) {
      // console.log(mentions);
      mentions.forEach(m => {
        m = m.slice(1);
        // console.log(m, m.toLowerCase());
        let user = users.find(u => {
          // console.log(u.user.name, m.toLowerCase());
          if (u.user.name.toLowerCase() === m.toLowerCase()) return true;
        }).user.name;
        // console.log('yes', user);
        validMentions.push({ og: m, fl: user });
      })
    }

    for (let i = 0; i < validMentions.length; i++) {
      safe = safe.replace('@' + validMentions[i].og, '<mention class="rounded-full px-2 py-1 bg-slate-800 text-blue-500 hover:text-blue-700">&#64;' + validMentions[i].fl + '</mention>');
    }
  } catch (e) {

  } finally {
    return { type: "message", who: user, message: safe, srcMessage: msgToParse, id: genId(), mentions: validMentions.map(m => m.fl) };
  }
}

app.listen(3000, () => {
  console.log('server started');
});
