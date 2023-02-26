# message schema

All messages are sent in JSON

## Actions

Actions are usually sent from the client to the server.

- sendMessage  
  This action sends a message to the server
  ```json
  {
    "type": "sendMessage",
    "data": "**Hello**! 👋"
  }
  ```
- react  
  This action lets you react to a message with one of the built-in reaction emoticons.
  **NOT IMLPEMENTED**
  ```json
  {
    "type": "react",
    "what": 4,
    "with": "smiley_grin"
  }
  ```

## Incoming

Incoming messages are from the server and report something happening.
The following incoming message types are found:
- message  
  The message type has a few other factors that change the appearance of the message.
  these are `msgType` and `announceType`.
  msgType can be `userMessage`, `announce`
  and announceType can be `info`, `error`, `warning`
  Announcement message types are currrently **NOT IMLPEMENTED**

Announcements show up differently than normal message and appear as a colored banner message.
Example announcement:
```json
{ type: "message", msgType: "announce", announceType: "info", message: "This is some important information that is broadcasted" }
```

Example message response from server:
```json
{ type: "message", who: UserObject, message: "This is a message", id: 12515122 }
```

Message data can be in Markdown, but is thouroughly cleaned by the server before it reaches the client to make sure users don't try to tamper with it.

## Errors

Error message example
Server to client
```json
{ error: true, message: "Example error message", code: 500 }
```

## Miscellaneous schema

### UserObject - a way to represent a user

There are two types of UserObject, full and minimal. Usually you recieve the minimal syntax

Minimal:
```json
{ 
  name: "chatty", 
  profileImage: 
    "https://i0.wp.com/repl.it/public/images/evalbot/evalbot_28.png?ssl=1" 
}
```

ProfileImage here can also be an object that contains default avatar information, if the user's avatar is not set:
```json
{ 
  name: "chatty", 
  profileImage: {
    c: "#f00",
    t: "#000"
  }   
}
```

Full:
```json
{
   // Unknown
}
```

# Planned features

- Sending and recieving messages
- Reacting to messages
- Retracting messages

- Built-in custom Chatty-specific emoji

## Rooms

`/c/(room id)` - connect to any channel

## User api

POST `/api/me/update`
```json
{
  "handle": "ktat",
  "confirmPassword": "*******",
  "bio": "**Hi im ktat**\nHow is it going"
}
```
API Response:
```json
{
  "success": "true"
}
```

GET `/user/:id`

## token authentication thing

Token Example: 
  ouku4rjjw9

When someone establishes a connection with the site it will send back a token (see example)
When you logout the token will get destroyed along with your session making it harder for people to login to your account and impersonate you.
The token will be used to authenticate high security api requests e.g., sending a message, changing user bio/data
Every login your token will be different to keep security across your account.
Tokens are better than using passwords because passwords don't change for long periods of time. Tokens will change every day or so.

Q: How does an authenticated user get a token?
A: it is given to them by the server on every login

You have sessions and tokens
your session and token have a link only that one token can be used on that one session.
this means you can have more than 2 instances just on different sessions
Tokens have a expiry date, just like the bottle of milk in your fridge, or