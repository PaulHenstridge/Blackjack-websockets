const express = require('express')
const socket = require('socket.io')

// App setup
const app = express()
const server = app.listen(4000, () => {
    console.log('server running')
})

// Static files
app.use(express.static('public'))

// trying to avoid Cors blocking.  masy have been VS live server issue...?
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

// Socket setup
const io = socket(server)


const activePlayers = []

let dealerHand = []
let playerHand = []
let stickingPlayers = []


io.on('connection', socket => {
    console.log(`socket ${socket.id} connected`)

    // Handle chat event
    socket.on('chat', data => {
        io.sockets.emit('chat', data)
    })

    socket.on('typing', data => {
        socket.broadcast.emit('typing', data)
    })

    // Deal card function
    function getCard(arr){
        values = [2,3,4,5,6,7,8,9,10,"J10","Q10","K10","A11"];
        suits = ["C", "S", "H", "D"];

        let valIndex = Math.floor(Math.random() * 13);
        let suitIndex = Math.floor(Math.random() * 4);

        arr.push((suits[suitIndex]+ values[valIndex]))
    }



    // handle blackjack events

    socket.on ('start', data => {
        console.log(data.playerName)
        activePlayers.push(data.playerName) 
        console.log('active players:' , activePlayers)
        // now the first person to click is activePlayers[0]
        // need to remove from the array if disconnected
        if (activePlayers.length <2) {
             socket.broadcast.emit('waiting', {opponent: data.playerName})
        } else {
        //deal cards into 2 arrays, pass through to Browser            
            getCard(playerHand)
            getCard(dealerHand)
            getCard(playerHand)
            getCard(dealerHand)
            console.log('4 cards dealt')

            io.sockets.emit('begin', {playerHand, dealerHand} )
        }
    })

    socket.on('twist', data => {
        let twistCard = []
        getCard(twistCard)
        io.sockets.emit('twist', {
            playerName: data.playerName,
            twistCard: twistCard
        })
    })



    socket.on('stick', data => {
        console.log('stick data', data)
       
        stickingPlayers.push(data)
        console.log('sticking players ', stickingPlayers)


        function pickWinner(stickingPlayers) {
            if (stickingPlayers[0].currentScore > stickingPlayers[1].currentScore) return `The winner is ${stickingPlayers[0].playerName}`
            if (stickingPlayers[0].currentScore === stickingPlayers[1].currentScore) {
               return "it's a tie!" 
            } else { 
                return `The winner is ${stickingPlayers[1].playerName}`
            }
        }  
        

        if (stickingPlayers.length > 1) {
            let winner = pickWinner(stickingPlayers)
            console.log('winner is : ', winner)
            io.sockets.emit('gameOver', {
                scores : stickingPlayers, 
                winner : winner
            })
        } else {
              io.sockets.emit('stick', { playerName: data.PlayerName })
        }
    })
            //     send thru playernames and scores and winnerName

            // browser will reveal cards, display scores, and name of  winner
          
            // change dealer, reveal 'play again?' button
            // if pressed, send a begin event.
        
    socket.on('playAgain', data => {
        dealerHand = []
        playerHand = []
        stickingPlayers = []
        socket.broadcast.emit('reset', {})
    })  
    
   



// bottom of socket connection - everything inside here
})





