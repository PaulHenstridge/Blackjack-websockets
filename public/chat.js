

// Make connection
const socket = io()

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
const playAgain = document.querySelector('#play-again')
const standUp = document.querySelector('#stand-up')
const endOptions = document.querySelector('.end-options')
const betWindow = document.querySelector('.betting-window')
const balance = document.querySelector('#balance')
const stake = document.querySelector('#stake')
const bet = document.querySelector('#bet')
const betResult = document.querySelector('.bet-result')



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
let aces = 0
let cash = 100
let currBet
    
start.addEventListener('click', () => {
    // hide button
    setTimeout( () => {
        start.classList.add('hidden')
        
        //nameInput.classList.add('hidden')   keep so non players can add name to chat?

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

    console.log('data from the begin event: ', data)
 
    playerCards.innerHTML = ''
    opponentCards.innerHTML = ''
    // unhide the betting window.  on clicking bet, below happens
    balance.innerText = `Your balance is $${cash}`
    betWindow.classList.remove('hidden')

    bet.addEventListener('click', () => {
        currBet = parseInt(stake.value)
        setTimeout( () => { betWindow.classList.add('hidden')})
    })
    
    gameInfo.innerText = `Lets Play Blackjack!`
    // deal the cards
    setTimeout(() => { dealCards(data) },1000)
    
    if (playerName === data.activePlayers[0] || playerName === data.activePlayers[1]){
            if (dealer) {
                setTimeout( () => {
                options.classList.remove('hidden')
            },2500)
            }
    } else {
        start.classList.add('hidden')
    }
    // if not an active player, hide start button
    
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
        // counting aces
        data.dealerHand.forEach( card => {
            if (card[1] === 'A') aces++
        })

        for (i=0;i<2;i++){          
            opponentCards.appendChild(createCard('blue_back'))
            playerCards.appendChild(createCard(data.dealerHand[i]))
        }
        currentScore = parseInt(data.dealerHand[0].replace(/\D/g, ""))
         + parseInt(data.dealerHand[1] .replace(/\D/g, ""))
        
    } else {
        data.playerHand.forEach( card => {
            if (card[1] === 'A') aces++
        })
        for (i=0;i<2;i++){
            playerCards.appendChild(createCard(data.playerHand[i]))
            opponentCards.appendChild(createCard('blue_back'))
        }
        currentScore = parseInt(data.playerHand[0].replace(/\D/g, "")) 
        + parseInt(data.playerHand[1] .replace(/\D/g, ""))
    }
    gameInfo.innerText = `your score: ${currentScore}`
    checkWin()
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
        if (data.twistCard[0][1] === 'A') aces++
        playerCards.appendChild(newCard)

        let cardVal = parseInt(data.twistCard[0].replace(/\D/g, ""))

        currentScore += cardVal
        gameInfo.innerText = `Your Score: ${currentScore}`

// separate win/lose conditions to another fuction bcs will have to be called a lot
// need to run on first deal as well as each twist
        checkWin()
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
    if ( (playerName === data.activePlayers[0] || playerName === data.activePlayers[1]) && data.stickingPlayer !== playerName) {  
        // unhide stick/twist buttions
        options.classList.remove('hidden')
        
    }
})

playAgain.addEventListener('click', () => {
    socket.emit('playAgain',{ playerName })
    setTimeout( () => {
        endOptions.classList.add('hidden')
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
        // increment overall scores  - not working currently (ties, but also other)
        data.winner === playerName ? playerWins++ : opponentWins++
        
        gameInfo.innerText = winMessage

        if (data.winner === playerName) {
            cash += currBet
            betResult.innerHTML = `
            <h4>YOU WON $${currBet}!  
            Your new balance is $${cash}<h4/>
            `
            betResult.classList.remove('hidden')
        } else {
            cash -= currBet
            betResult.innerHTML = `
            <h4>YOU LOST $${currBet}!  
            Your new balance is $${cash}<h4/>
            `
            // betResult.classList.add('bet-lose')
            betResult.classList.remove('hidden')     
        }

    // scores disabled until working properly
        // myScore.innerText = playerWins
        // oppScore.innerText = opponentWins

    },1000)
    

    setTimeout( () => {
    endOptions.classList.remove('hidden')
   
    },3000)



    // restart the game options
    // turn should switch to other player.
        // cheat option : let first to click be dealer again  <-- no
    // reset all things like hands, active players, stickingPlayers
        // think about where to set them,  global, or on each new begin event
})
      
//  problem with the start event being fired more than once, resulting in more than 2 cards dealt.
// need to identify where the calls are coming form and why.


socket.on('reset', data => {
    currentScore = 0
    endOptions.classList.add('hidden')
    betResult.classList.add('hidden')
    betWindow.classList.remove('hidden')

    // switch 'dealer' 
    if(playerName === data.activePlayers[0] || playerName === data.activePlayers[1]){
        dealer ? !dealer : dealer
    }
    
    if ( playerName === data.restartingPlayer) {
         socket.emit('start', { playerName })
    }
})

standUp.addEventListener('click', () => {
    socket.emit('standUp', { playerName })
    endOptions.classList.add('hidden')
})

socket.on('stoodUp', data => {
    if (data.sittingPlayer === playerName) {
        gameInfo.innerText = `
        ${data.standingPlayer} has stood up.
        Waiting for new player to sit.
        `
    } else {
        gameInfo.innerText = `
        ${data.standingPlayer} has stood up.
        Click start to sit!
        `
        start.classList.remove('hidden')
    }
})



function checkWin() {

    let cardCount = playerCards.childElementCount

    // problem - playercards does not get added to when player twists
        // do a card counter, or measure length of hand div?
    /// also prob, currently playercards is sending through prev turns cards as well and 
    // ... I DONT KNOW WHY!!

    if (cardCount === 2 && currentScore === 21) {
        alert('Blackjack!')
        playerWins++
        // game restarts with other person as 'dealer'
        // send a gameOver event to server with playerName, score, win: true/false
    }

    //if player has an ace && score >21 { score --10}
    for (let i = 0; i< aces; i++) {
        if (currentScore >21){
            aces--
            currentScore-=10
            gameInfo.innerText = `
            Ace in the hole!
            Your score is ${currentScore}
            `
        }
    }

    if (cardCount === 5 && currentScore <22) {
        alert('Five Card Trick!')
        playerWins++
        // game restarts with other person as 'dealer'
        // i thik the server should be keeping track of the scores??  
    }

    if (currentScore > 21) {
        alert ('You are bust!')
        currentScore = 0
        socket.emit('stick', {
            playerName, 
            currentScore
        })
        // hide stick/twist buttons
        setTimeout( () => {
            options.classList.add('hidden')
        },500)
        opponentWins++
        // game restarts
    }
}



/*
    add a reset button that kicks everyone out and resets all variables.
    change fonts - on gameInfo at least
    add gambling
        place stake before cards dealt
        if win balance += stake
        if lose or draw balance -= stake.  <-- do with ternary 
        if balance < 1 - you are broke!
*/
