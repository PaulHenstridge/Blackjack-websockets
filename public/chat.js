

// Make connection
const socket = io.connect('http://localhost:4000')

//Query DOM
    //chat
const message = document.querySelector('#message')
const handle = document.querySelector('#handle')
const send = document.querySelector('#send')
const output = document.querySelector('#output')
const feedback = document.querySelector('#feedback')

    //blackjack
const start = document.querySelector('#start-btn')
const nameInput = document.querySelector('#name')
const gameInfo = document.querySelector('#game-info')
const myScore = document.querySelector('#my-score')
const oppScore = document.querySelector('#opp-score')
const opponentCards = document.querySelector('#opponent')
const playerCards = document.querySelector('#player')
const options = document.querySelector('#options')
const stick = document.querySelector('#stick')
const twist = document.querySelector('#twist')
const playAgain = document.querySelector('#playAgain')




// Emit events

send.addEventListener('click', () => {
    socket.emit('chat',{
        message: message.value,
        handle: nameInput.value
    })
  message.value = ''
})

message.addEventListener('keypress', () => {
    socket.emit('typing', nameInput.value)
})

// Listen for events
socket.on('chat', data => {
    feedback.innerHTML =''
    output.innerHTML += `<p><strong>${data.handle}</strong> ${data.message}</p>`
})

socket.on('typing', data => {
    feedback.innerHTML = `<p><em>${data} is typing a wee message...</em></p>`
})


// blackjack logic

let dealer = true
let playerName
let currentScore = 0
let playerWins = 0
let opponentWins = 0
    
start.addEventListener('click', () => {
    // hide button
    setTimeout( () => {
        start.classList.add('hidden')
        
        nameInput.classList.add('hidden')

        gameInfo.innerText = 'waiting to begin...'

    }, 500)

    // send a startGame event to the server

    playerName = nameInput.value
    socket.emit('start', { playerName })
})

// handle start event responses from server
socket.on('waiting', data => {
        gameInfo.innerText = `${data.opponent} is ready to play!`
        dealer = false
})

socket.on('begin', data => {
    console.log(data)
    playerCards.innerHTML = ''
    opponentCards.innerHTML = ''
    gameInfo.innerText = `Lets Play Blackjack!`
      setTimeout( () => {
            dealCards(data)
        },1000)

        if (dealer) {
             setTimeout( () => {
            options.classList.remove('hidden')
        },2500)
        }
       
        // if dealer unhide stick/twist buttons. 
        // message for other player e.g. player name's turn ??
        //stick triggers an event to server
            // on stick event server sends a endTurn event that gives stick/twist options to other player
            // and displays a message to the first player
})

function createCard(cardData) {
    let card = document.createElement('div')
        card.classList.add('card')
        card.style.backgroundImage = `url(cards/${cardData}.png)`
        return card
}

function dealCards(data) {
    //create a div w/ class=card for first card in player array (transition in from below)
    //create a div w/ class=card for first card in dealer array (transition in from above)
    //repeat for 2nd cards

    if (dealer) {
        for (i=0;i<2;i++){          
            opponentCards.appendChild(createCard('blue_back'))
            playerCards.appendChild(createCard(data.dealerHand[i]))
        }
        currentScore = parseInt(data.dealerHand[0].replace(/\D/g, ""))
         + parseInt(data.dealerHand[1] .replace(/\D/g, ""))
        
    } else {
        for (i=0;i<2;i++){
            playerCards.appendChild(createCard(data.playerHand[i]))
            opponentCards.appendChild(createCard('blue_back'))
        }
        currentScore = parseInt(data.playerHand[0].replace(/\D/g, "")) 
        + parseInt(data.playerHand[1] .replace(/\D/g, ""))
    }
    gameInfo.innerText = `your score: ${currentScore}`
}

// stick or twist logic

            /*twist function:
                pings the server and receives a card back
                    sends name to server. 
                    server sneds back name with card. 
                    browser checks if name returned === playername
                
                calls createCard, passing in new card.
                appends the card to the players hand
                recalculates the score and displays it
                checks win/lose conditions
            */

twist.addEventListener('click', () => {
    socket.emit('twist', { playerName })
})

// receiving a twist event
socket.on('twist', data => {
    if (data.playerName === playerName) {
        let newCard = createCard(data.twistCard[0])
        playerCards.appendChild(newCard)

        let cardVal = parseInt(data.twistCard[0].replace(/\D/g, ""))

        currentScore += cardVal
        gameInfo.innerText = `Your Score: ${currentScore}`

// separate win/lose conditions to another fuction bcs will have to be called a lot
// need to run on first deal as well as each twist

        if (playerCards.length === 2 && currentScore === 21) {
            alert('Blackjack!')
            playerWins++
            // game restarts with other person as 'dealer'
            // send a gameOver event to server with playerName, score, win: true/false
        }

        if (playerCards.length === 5 && currentScore <22) {
            alert('Five Card Trick!')
            playerWins++
            // game restarts with other person as 'dealer'
            // i thik the server should be keeping track of the scores??  
        }

        if (currentScore > 21) {
            alert ('You are bust!')
            currentScore = 0
            socket.emit('stick', {
                playerName, currentScore
            })
            // hide stick/twist buttons
            setTimeout( () => {
                options.classList.add('hidden')
            },500)
            opponentWins++
            // game restarts
        }
    }

    if (data.playerName !== playerName) {
        let newCard = createCard('blue_back')
        opponentCards.appendChild(newCard)
    }

})

// send stick event to server with name, score
stick.addEventListener( 'click', () => {
    socket.emit('stick', {
        playerName, currentScore
    })
    // hide stick/twist buttons
    setTimeout( () => {
        options.classList.add('hidden')
    },200)
})

// handling a received stick event
    socket.on('stick', data => {
        if ( data.playerName !== playerName) {  // should I transmit form the server to avoid this check?  think about adapting for multiplayer!
                                                // name of transmitted even can be diferent e.g. oppStick...?
            // unhide stick/twist buttions
            options.classList.remove('hidden')
            
        }
    })

    playAgain.addEventListener('click', () => {
        // switch 'dealer' for clicking player
        dealer ? !dealer : dealer
        socket.emit('playAgain',{})
        setTimeout( () => {
            playAgain.classList.add('hidden')
        },250)
    })

    socket.on('gameOver', data => {
        console.log(data)
        setTimeout( () => {
            let winMessage = `
                ${data.scores[0].playerName} scored ${data.scores[0].currentScore},
                ${data.scores[1].playerName} scored ${data.scores[1].currentScore}.
                Winner : ${data.winner} 
                `
            // increment overall scores
            data.winner === playerName ? playerWins++ : opponentWins++
            
            gameInfo.innerText = winMessage

            myScore.innerText = playerWins
            oppScore.innerText = opponentWins

        },1000)
        

        setTimeout( () => {
        playAgain.classList.remove('hidden')
        },3000)



        // restart the game options
        // turn should switch to other player.
            // cheat option : let first to click be dealer again  <-- no
        // reset all things like hands, active players, stickingPlayers
            // think about where to set them,  global, or on each new begin event
    })
      
socket.on('reset', data => {
    currentScore = 0
    playAgain.classList.add('hidden')

    // switch 'dealer' for non-clicking player
    dealer ? !dealer : dealer
    socket.emit('start', { playerName })
})



