const CHATTY_EPOCH = 1673651779353;

function randomId() {
  // Generate a random number
  let currentTime = Date.now() - CHATTY_EPOCH;
  return (currentTime + '' + Math.floor(Math.random() * 1000)).toString();  
}

console.log(randomId(), randomId());