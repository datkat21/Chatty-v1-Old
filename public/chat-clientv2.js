function $(e) { return document.querySelector(e) }
let room = "hangout"

let qroom = new URLSearchParams(window.location.search).get("room")

if (qroom !== null) {
  room = qroom
}

let spot = location.protocol.replace('http', 'ws') + '//' + location.host + `/c/${room}`;

let token = null;
let me = null;
let myId = null;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let sounds = {
  incomingMsg: { filename: 'incomingMessage.mp3', buffer: null },
  outgoingMsg: { filename: 'outgoingMessage.mp3', buffer: null },
  connect: { filename: 'connected.mp3', buffer: null },
  disconnect: { filename: 'disconnected.mp3', buffer: null },
  notification: { filename: 'notification.mp3', buffer: null },
}

async function loadAudio(key) {
  fetch('/sounds/' + sounds[key].filename)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      sounds[key].buffer = audioBuffer;
    });
}
(async () => {
  let keys = Object.keys(sounds);
  for (let i = 0; i < keys.length; i++) {
    await loadAudio(keys[i]);
  }
})();
function playSound(soundName) {
  const bufferSource = audioContext.createBufferSource();
  bufferSource.buffer = sounds[soundName].buffer;
  bufferSource.connect(audioContext.destination);
  bufferSource.start();
}


function changeRoom(croom) {
  room = croom
  spot = location.protocol.replace('http', 'ws') + '//' + location.host + `/c/${room}`;
  sock.close()
  $("#roomName").innerText = croom
}

function handleMessage(json) {
  if (json.you) handleUserUpdate(json.you);

  if (json.code == 402 || json.code == 401) {
    // bad token
    clearInterval(heartbeat);
    sock.close();
  }

  switch (json.type) {
    case 'message':
    case 'newMessage':
      createMessage(json);
      if (json.who.name === me && json.who.id === myId) {
        try { playSound('outgoingMsg'); } catch (_) { }
      } else {
        try { playSound('incomingMsg'); } catch (_) { }
        if (json.mentions.length > 0 && json.mentions.includes(me)) {
          try { playSound('notification'); } catch (_) { }
        }
      }
      break;
    case "hbr":
      $("#OnlineUsersCount").innerText = json.message.length;
      updateOnlineUsersList(json.message);
      return;
  }
  console.log(json);
}

function updateOnlineUsersList(list) {
  list.sort((a, b) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  var panel = document.querySelector('.users-panel .list');
  panel.innerHTML = '';
  for (let i = 0; i < list.length; i++) {
    let userCard = document.createElement('div');
    userCard.classList.add('flex', 'gap-2', 'items-center');
    let userAvatar = document.createElement('div');
    userAvatar.classList.add('w-12', 'h-12', 'border-2', 'rounded-full', 'bg-cover', `bg-[url('${list[i].profileImage}')]`, 'flex', 'grow-0', 'shrink-0', 'basis-auto');
    let userName = document.createElement('div');
    userName.innerText = list[i].name;
    list[i].isBot === true ? userName.innerHTML += '<span class="ml-2 rounded-full text-xs font-bold px-2 py-1 bg-slate-800">Bot</span>' : 0;
    userCard.appendChild(userAvatar);
    userCard.appendChild(userName);
    document.querySelector('.users-panel .list').appendChild(userCard);
  }
}

function handleUserUpdate(you) {
  token = you.token;
  window.token = token;
  me = you.user.name;
  myId = you.user.id;
  console.log('handleUserUpdate', you, token);
}

function fixMessage(message) {
  var regex = /<a[^>]*href="(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))"[^>]*>(.*?)<\/a>/g;
  var input = message;
  var output = input.replace(regex, (_match, href, linkText) => {
    var domain = new URL(href).hostname;
    return `<a class="text-blue-300 hover:text-blue-500" href="${href}">${linkText}</a><span class="small-label text-slate-600 ml-2 mr-4">(${domain})</span>`;
  });
  return output;
}

function fixMessageHtml(msg) {
  let mentions = msg.querySelectorAll('mention');
  mentions.forEach(e => {
    if (e.innerText === '@' + me) {
      e.classList.remove('text-blue-500', 'hover:text-blue-700');
      e.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-slate-200');
    }
  });
  let links = msg.querySelectorAll('a');
  links.forEach(e => {e.setAttribute('target','_blank')});
}

const testers = ['Flippergail', 'LuisAFK', 'Vincent392', 'kat-', 'ktat', 'datkat21', 'deemdagreat2007', 'bddy', 'repx']


function createMessage(data) {
  if ($('#messages .message:last-child .meta .name') !== null) {
    if ($('#messages .message:last-child .meta .name span').innerText === data.who.name && data.who.id === $('#messages .message:last-child .meta .name').dataset.id) {
      return msgGroup(data);
    }
  }

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
  message.classList.add('message', 'flex', 'gap-2');

  let avatar = document.createElement('div');
  avatar.classList.add('w-12', 'h-12', 'border-2', 'rounded-full', 'bg-cover', `bg-[url('${data.who.profileImage}')]`, 'flex', 'grow-0', 'shrink-0', 'basis-auto');
  // avatar.style.setProperty('--url', 'url(' + data.who.profileImage + ")");

  let span = document.createElement('span');
  span.classList.add('flex', 'flex-col');

  let meta = document.createElement('div');
  meta.classList.add('meta', 'flex', 'gap-2');
  let metaName = document.createElement('div');
  metaName.classList.add('name');
  let metaNameSpan = document.createElement('span');
  metaName.dataset.id = data.who.id;

  let metaTime = document.createElement('div');
  metaTime.classList.add('time', 'text-slate-600');

  let content = document.createElement('div');
  content.classList.add('content', 'mt-1');

  metaName.appendChild(metaNameSpan);
  span.appendChild(meta);
  span.appendChild(content);
  meta.appendChild(metaName);
  meta.appendChild(metaTime);
  message.appendChild(avatar);
  message.appendChild(span);

  metaNameSpan.innerText = data.who.name;
  data.who.isBot === true ? metaName.innerHTML += '<span class="ml-2 rounded-full text-xs font-bold px-2 py-1 bg-slate-800">Bot</span>' : 0;

	
	data.who.name === 'bddy' ? metaName.innerHTML += '<span class="ml-2 rounded-full text-xs font-bold px-2 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500">bddy</span>' : 0;

	data.who.name === 'repx' ? metaName.innerHTML += '<span class="ml-2 rounded-full text-xs font-bold px-2 py-1 bg-purple-400">replit v2</span>' : 0;

	
	if (testers.includes(data.who.name)) {
		metaName.innerHTML += '<span class="ml-2 rounded-full text-xs font-bold px-2 py-1 bg-slate-800">Tester</span>'
	}

	
  metaTime.innerText = dateString + " at " + timeString;

  let messageContent = fixMessage(data.message);
  content.innerHTML = messageContent;
  fixMessageHtml(content);

  // twemoji.parse(message);
  document.querySelector('#messages').appendChild(message);
  message.scrollIntoView();
}

function msgGroup(data) {
  try {
    let msg = $('#messages .message:last-child');
    if (msg.querySelector('.meta .name span').innerText === data.who.name && data.who.id === msg.querySelector('.meta .name').dataset.id) {
      let content = document.createElement('div');
      content.classList.add('content', 'mt-1');
      content.innerHTML = fixMessage(data.message);
      fixMessageHtml(content);
      msg.querySelector('span').appendChild(content);
      msg.scrollIntoView();
      content.scrollIntoView();
    } else alert('what')
  } catch (e) { alert(e) }
}

let heartbeat;

function connect() {
  let sock = new WebSocket(spot);

  window.sock = sock;

  sock.onopen = _ => { console.log('Connected.'); playSound('connect'); };
  sock.onclose = _ => { clearInterval(heartbeat); console.log("Disconnected, Reconnecting in 3 seconds,"); setTimeout(connect, 3000); playSound('disconnect'); };
  sock.onerror = e => { clearInterval(heartbeat); console.log('Error: ' + e) };
  sock.onmessage = e => { try { var json; json = JSON.parse(e.data); handleMessage(json) } catch (e) {/*ignore*/ } };

  // sock.send(JSON.stringify({ "type": "heartbeat", "token": token }))
  heartbeat = setInterval(() => {
    try {
      sock.send(JSON.stringify({ "type": "heartbeat", "token": token }))
    } catch (e) {
      sock.close()
      clearInterval(heartbeat)
    }
  }, 1000)

}

window.onload = _ => {

  $("#roomName").innerText = room

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