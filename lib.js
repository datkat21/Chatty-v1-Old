let socks = [];
let userTokens = [];

function jsonTryParse(str) {
  try { let s = JSON.parse(str); return s; } catch { return false }
}
function findEmptySockId(label) {
  let r = socks[label].findIndex((p) => p === null);
  return r !== -1 ? r : false;
}
function appendSock(label, ws) {
  if (socks[label] == null || socks[label] === undefined) {
    socks[label] = [];
  }
  var sockId = findEmptySockId(label) || socks[label].length;
  socks[label][sockId] = ws;
  return sockId;
}
function getSock(label, id) {
  return socks[label][id];
}
function getUniqueUsers(label) {
  // online unique users
  return [...new Set(socks[label])];
}
function getUsers(label) {
  // ALL online connections
  return socks[label];
}
function remSock(label, i) {
  socks[label][i] = null;
}

function appendUserToken(label, token) {
  if (userTokens[label] == null || userTokens[label] === undefined) {
    userTokens[label] = [];
  }
  return userTokens[label].push(token);
}
function remUserToken(label, i) {
  userTokens[label][i] = null;
}
function getUserTokens(label) {
  return userTokens[label];
}

function getAllSocks() {
  return socks;
}
function getAllUTs() {
  return getAllUTs;
}
module.exports = {jsonTryParse,findEmptySockId,appendSock,getSock,getUniqueUsers,getUsers,remSock,appendUserToken,remUserToken,getUserTokens}