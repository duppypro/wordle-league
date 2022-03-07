'use strict'
// play Wordle competitevly with a forced random first guess

///////////////////////// WORDLE FUNCTIONS //////////////////
const updateDOMFromStates = (allPS) => {
    let sel = d3.select('.wordle-challenge').selectAll('div.wordle-puzzle')
        .data(allPS, ps=>ps.ID)
        .join(
            enter => enter
                .append('div').attr('class', 'wordle-puzzle'), // create puzzle boards that are new to the array puzzleStates
            old => old,
            exit => exit
                .transition().duration(677).style('opacity',0).remove()
        )
        /* update old and new here */
        .text(ps=>`Puzzle #${ps.ID} ${firstGuessByID[ps.ID].toUpperCase()} ${solutionByID[ps.ID].toUpperCase()}`)
        // NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
        //       except update only includes elements before the enter
        //       so the pattern is more accurately: .join(enter(),old(),exit()).update()
    //selPuzzles.call()        //.selectAll('div.wordle-guess').data()
        //.append('div').attr('class', 'wordle-guess') // create puzzle boards that are new to the array puzzleStates
    return sel
}
//////////////////////////// USER ALL-TIME VIEW /////////////////////
//// ALL-TIME view or LEAGUE view?
// TODO: login a user, provide anonymous view
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams
// init state for league
let userID = 'this-session'
// init DOM for league
d3.select("#wordle-league").append('div').text("MVP: Challenge is unique to this browser session. Do not close this tab.");

//////////////////////// CHALLENGE ///////////////////////////////////////
// init challenge state. A challenge is a set of 7 or 30 games with pre-selected solution order to compete among diff users
// TODO: offer choice of word set. Defaulting to original
// TODO: save state per user, currently just per session
// TODO: bind games to fixed time periods (assume local Day)
let challengeID = 'session-only'
let sharedFirstGuess = true // only handle this case for now
let numPuzzles = 7 // TODO: enable 7 or 30 and defining set of players in Challenge, eventually allow sets of team
let currentPuzzleID = 0
let possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
let allValidWords = possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)
let solutionByID = removeRandomSubset(possibleSolutionWords, numPuzzles)
let firstGuessByID = sharedFirstGuess ? removeRandomSubset(possibleSolutionWords, numPuzzles) : []

// done with challenge state initialized

// init DOM for Challenge
d3.select("#wordle-league").append('div').attr('class','wordle-challenge')
d3.select('body').on('keydown',(e)=>{
    console.log(e)
    console.log(d3.event)
})
//////////////////////////// PUZZLE ///////////////////////////////////////
// init state for all puzzles
let puzzleStates = []
for (let i=0; i < numPuzzles; i++) {
    // init new puzzle state
    let puzzleState = {
        ID: i, // ID puzzles as 0-6
        guesses: [sharedFirstGuess ? firstGuessByID[i] : '     ', '     ', '     ', '     ', '     ', '     ', '     ', '?????'],
        cursorPos: {guess:1, letter: sharedFirstGuess ? 6 : 1},
        solution: solutionByID[i],
        finished: false
    }
    puzzleStates.push(puzzleState)
}

updateDOMFromStates(puzzleStates)

// keydown listener drives the game from here on