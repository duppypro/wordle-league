'use strict'
// play Wordle competitevly with a forced random first guess

//////////////////////////// USER ALL-TIME VIEW /////////////////////
//// ALL-TIME view or LEAGUE view?
// TODO: login a user, provide anonymous view
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams
// init state for league
let leagueState = {
    userID: 'your-session'
}
// init DOM for league
d3.select("#wordle-league").append('div').attr('class','challenge board').text("MVP: Challenge is unique to this browser session. Do not close this tab.");

//////////////////////// CHALLENGE ///////////////////////////////////////
// init challenge state. A challenge is a set of 7 or 30 games with pre-selected solution order to compete among diff users
// TODO: offer choice of word set. Defaulting to original
// TODO: save state per user, currently just per session
// TODO: bind games to fixed time periods (assume local Day)
let challengeID = 'session-only'
let sharedFirstGuess = true // only handle this case for now
let numPuzzles = 7 // TODO: enable 7 or 30 and defining set of players in Challenge, eventually allow sets of team
let puzzleIndex = 0
let possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
let allValidWords = possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)
let solutionByGame = removeRandomSubset(possibleSolutionWords, numPuzzles)
let firstGuessByGame = sharedFirstGuess ? removeRandomSubset(possibleSolutionWords, numPuzzles) : []

// done with challenge state initialized

// init DOM for Challenge
d3.select("#wordle-league").append('div').attr('class','wordle-challenge')

// create 
// init
// iterate over puzzles in challenge
while (puzzleIndex < numPuzzles) {
    d3.select('.wordle-challenge').append('div').attr('class', 'wordle-puzzle')
        .text('Puzzle '+ puzzleIndex + ' ' + firstGuessByGame[puzzleIndex].toUpperCase() + ' ' + solutionByGame[puzzleIndex].toUpperCase())
    puzzleIndex++
}