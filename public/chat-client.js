function $(e) { return document.querySelector(e) }

let spot = location.protocol.replace('http', 'ws') + '//' + location.host + location.pathname;
// spot is usually wss://chatty.ktat.repl.co/c/chatname

let token = null;
let me = null;

let incomingMsgSound = new Audio('/sounds/incomingMessage.mp3');
let outgoingMsgSound = new Audio('/sounds/outgoingMessage.mp3');
let userJoinSound = new Audio('/sounds/userJoin.mp3');
let userLeftSound = new Audio('/sounds/userLeave.mp3');

function handleMessage(json) {
  if (json.you) handleUserUpdate(json.you);
  switch (json.type) {
    case 'message':
    case 'newMessage':
      createMessage(json);
      if (json.who.name === me) {
        try { outgoingMsgSound.play(); } catch (_) { }
      } else {
        try { incomingMsgSound.play(); } catch (_) { }
      }
      break;
  }
  console.log(json);
}

function handleUserUpdate(you) {
  token = you.token;

  me = you.user.name;
  console.log('handleUserUpdate', you, token);
}

function safeLinks(message) {
  var regex = /<a[^>]*href="(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))"[^>]*>(.*?)<\/a>/g;
  var input = message;
  var output = input.replace(regex, (_match, href, linkText) => {
    var domain = new URL(href).hostname;
    return `<a href="${href}">${linkText}</a><span class="small-label">(${domain})</span>`;
  });
  return output;
}

function createMessage(data) {
  /*
  message: "<p>Hello there</p>"
  who: { name: "ktat", profileImage: "https://storage.googleapis.com/replit/images/1672190635272_db7f0b74025ebf576d9f561a687d32de.png" }
  */

  Array.from(document.querySelectorAll('.some-element')).pop();

  let date = new Date();

  let options = { hour: 'numeric', minute: 'numeric' };
  let timeString = new Intl.DateTimeFormat('en-US', options).format(date);

  let today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dateString = "";
  if (date.toDateString() === today.toDateString()) {
    dateString = "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    dateString = "Yesterday";
  } else {
    dateString = date.toDateString();
  }

  let message = document.createElement('div');
  message.classList.add('message');

  let avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.style.setProperty('--url', 'url(' + data.who.profileImage + ")");

  let meta = document.createElement('div');
  meta.classList.add('meta');
  let metaName = document.createElement('div');
  metaName.classList.add('name');
  let metaTime = document.createElement('div');
  metaTime.classList.add('time');

  let content = document.createElement('div');
  content.classList.add('content');

  meta.appendChild(metaName);
  meta.appendChild(metaTime);
  message.appendChild(avatar);
  message.appendChild(meta);
  message.appendChild(content);

  metaName.innerText = data.who.name;
  metaTime.innerText = dateString + " at " + timeString;

  console.log("hiHIAIHIHIIHII!!!");
  let messageContent = safeLinks(data.message);
  console.log("hiHIAIHIHIIHII!!2",messageContent);
  content.innerHTML = messageContent;

  // twemoji.parse(message);
  document.querySelector('#messages').appendChild(message);
  message.scrollIntoView();
}

function connect() {
  let sock = new WebSocket(spot);

  window.sock = sock;

  sock.onopen = e => { $('#status').innerText = 'Connected.' };
  sock.onclose = e => { $('#status').innerText = 'Disconnected.'; setTimeout(connect, 3000) };
  sock.onerror = e => { $('#status').innerText = 'Error: ' + e };
  sock.onmessage = e => { try { var json; json = JSON.parse(e.data); handleMessage(json) } catch (e) {/*ignore*/ } };

}

window.onload = _ => {

  connect();
  document.querySelector('#chat-input').addEventListener("keydown", (e) => {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      if (e.target.value) {
        sock.send(JSON.stringify(
          {
            type: "sendMessage",
            data: e.target.value,
            token
          }
        ));
        e.target.value = '';
      }
    }
    var currentRows = e.target.value.split("\n").length;
    if (keyCode === 13 && e.shiftKey) {
      currentRows++;
    }
    if (currentRows <= 5) {
      e.target.rows = currentRows;
    } else {
      e.target.rows = 5;
    }
  })

}