'use strict'
// play Wordle competitevly with a forced random first guess

///////////////////////// WORDLE FUNCTIONS //////////////////
const updateDOMFromStates = (allPS) => {
	let selPuzzles = d3.select('.wordle-challenge').selectAll('div.wordle-puzzle')
		.data(allPS, ps=>ps.ID)
		.join(
			enter => enter
				.append('div').attr('class', 'wordle-puzzle')
				.style('text-align', 'center')
				.style('width','350px')
				.style('height', sharedFirstGuess ? '370px' : '300px'), // create puzzle boards that are new to the array puzzleStates
			old => old,
			exit => exit
				.transition().duration(677).style('opacity',0).remove()
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.text(ps=>`Puzzle #${ps.ID+1}`)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update 6 or 7 guess rows
	selPuzzles.each((ps, i, nodes) => {
		d3.select(nodes[i]).selectAll('div.guessRow')
			.data(ps.guesses)
			.join(
				enter => enter
					.append('div').attr('class','guessRow')
					.style('display', 'grid')
					.style('grid-template-columns', 'repeat(5, 1fr)')
					.style('grid-gap', '5px'),
				old => old,
				exit => exit
					.transition().duration(677).style('opacity',0).remove()
				)
			// just a container for the letters, do not add any text(g=>`|${g}|`)
		.each((guess, i, nodes) => {
			d3.select(nodes[i]).selectAll('div.guessLetter')
			.data(guess)
			.join(
				enter => enter
					.append('div').attr('class','guessLetter')
					.style('width', '100%')
					.style('display', 'inline-flex')
					.style('justify-content', 'center')
					.style('align-items', 'center')
					.style('font-size', '2rem')
					.style('line-height', '2rem')
					.style('font-weight', 'bold')
					.style('vertical-align', 'middle')
					.style('box-sizing', 'border-box'),
				old => old,
				exit => exit
					.transition().duration(677).style('opacity',0).remove()
				)
			.text(l=>`[${l}]`)
		})
	})


	return selPuzzles
}

const updatePuzzleState = (key) => {
	if (key == 'Enter') {
		puzzleStates[currentPuzzleID].finished = true // allways
		puzzleStates[currentPuzzleID].guesses[7] = solutionByID[currentPuzzleID]
		if (currentPuzzleID < numPuzzles - 1) { // normal case
			currentPuzzleID = currentPuzzleID + 1
		}
	}
	if (key == 'Backspace') {
		if (currentPuzzleID == numPuzzles - 1 && puzzleStates[currentPuzzleID].finished) {
			// do nothing
		} else {
			if (currentPuzzleID > 0) { // normal case
				currentPuzzleID = currentPuzzleID - 1
			}
		}
		puzzleStates[currentPuzzleID].finished = false
		puzzleStates[currentPuzzleID].guesses[7] = '?????'
	}
	if (allValidLetters.indexOf(key.toLowerCase()) != -1) {
		console.log(`Guess ${key.toUpperCase()}`)
	}
	updateDOMFromStates(puzzleStates)
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
// TODO: What is best practice way to avoid so many globals?
let challengeID = 'session-only'
let sharedFirstGuess = true // only handle this case for now
let numPuzzles = 7 // TODO: enable 7 or 30 and defining set of players in Challenge, eventually allow sets of team
let currentPuzzleID = 0
let possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
let allValidWords = possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)
let allValidLetters = "abcdefghijklmnopqrstuvwxyz"
let solutionByID = removeRandomSubset(possibleSolutionWords, numPuzzles)
let firstGuessByID = sharedFirstGuess ? removeRandomSubset(possibleSolutionWords, numPuzzles) : []

// done with challenge state initialized

// init DOM for Challenge
d3.select("#wordle-league").append('div').attr('class','wordle-challenge')
	.style('display', 'block')
	.style('justify-content', 'center')
	.style('align-items', 'center')
	//.style('flex-grow', 1)
	//.style('overflow', 'hidden')
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

// init DOM for puzzles
updateDOMFromStates(puzzleStates)

d3.select('body').on('keydown', (e) => updatePuzzleState(e.key))
// keydown listener drives the game from here on