  # Bot 

- Rule of Bots
  - Bots cannot speak to bots
  - Bots cannot speak without user interaction/events
  - Bots can only respond to slash commands

/botname help

/about botname

# Schema

`wss://chatty.ktat.repl.co/b/:room`

- ← Server sends bot token
- ← User send slash command
- ← Server gives bot slash command id (for verification)
- → Bot sends message below + heartbeats
```json

{
  "type": "bot",
	"bot": {
 		"name": "Example bot",
    	"profileColor": "",
    	"info": "Example i guess",
 	},
	"wssMessageData": {
		"token": "YWJjZGVnaTY1Mjc2ODQ1ODY3NDc2cXFxcQ==",
		"slashId": "MTE2MjAyMzM1OSlVc2VyOkVuWm9uMyxDb21tYW5kOnRlc3Q="
	},
	"data": "Beep boop! Test complete!"
}
```

The `slashId` key is to make sure the bot can only respond to slash commands