'use strict'
// play Wordle competitevly with a forced random first guess

///////////////////////// WORDLE FUNCTIONS //////////////////
const updateDOMFromPuzzleStates = (allPuzzles) => {
	let selPuzzles = d3.select('.wordle-challenge').selectAll('div.wordle-puzzle')  // NYT Wordle calls this 'div#game div#board-container div#board'
		.data(allPuzzles, puzzle=>puzzle.ID) // make a puzzle element for each puzzle in this challenge
		.join(
			enter => enter
				.append('div').attr('class', 'wordle-puzzle')
				.style('text-align', 'center')
				.style('width','350px')
				.style('height', sharedStartWordMode ? '670px' : '500px'), // create puzzle boards that are new to the array allPuzzleStates
			old => old,
			exit => exit
				.transition().duration(677).style('opacity',0).remove()
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.text(puzzle=>`Puzzle #${puzzle.ID+1} || Guesses: ${puzzle.cursorPos.guessRow} / Final Score: ${puzzle.finished ? puzzle.finalScore : '-'}`)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update 6 or 7 guess rows
	selPuzzles.each((puzzle, i, nodes) => { //this is called for each div.wordle-puzzle
		//puzzleState (puzzle)
		d3.select(nodes[i]).selectAll('div.guessRow') // NYT Wordle calls this 'game-row.row'
			.data(puzzle.guessWords) // make a row element for each guessWord in this puzzle
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
				d3.select(nodes[i]).selectAll('div.letterBox div.guessLetter') // NYT Wordle calls this 'game-tile div.tile'
				.data(guess)
				.join(
					enter => {
						let sel = enter
							.append('div').attr('class','letterBox')
								.style('display', 'inline-block')
								.style('background-color', 'black')
								.style('width', '62px')
								.style('height', '62px')
							.append('div').attr('class','guessLetter')
								.style('border', '2px solid #3a3a3c')
								.style('width', '100%')
								.style('height', '100%')
								.style('display', 'inline-flex')
								.style('justify-content', 'center')
								.style('align-items', 'center')
								.style('font-size', '2rem')
								.style('line-height', '2rem')
								.style('font-weight', 'bold')
								.style('vertical-align', 'middle')
								.style('box-sizing', 'border-box')
								.style('font-family', 'Clear Sans, Helvetica Neue, Arial, sans-serif')
								.style('text-transform','uppercase')
						return sel
					},
					old => old,
					exit => exit
						.transition().duration(677).style('opacity',0).remove()
				)
				// update all here because .join() returns merge of enter() and old()
				.style('background-color', (letter,i,nodes) => {
					if (allValidLetters.indexOf(letter) != -1) {
						return ['#3a3a3c', '#538d4e', '#b59f3b'][randomIndex(3)]
					} else {
						return 'black'
					}
				})
				.text(letter => letter)
			})
	}) // end selPuzzles.each()
	return selPuzzles
}

const updatePuzzle = (key) => {
	if (key == 'Enter') {
		allPuzzles[currentPuzzleID].finished = true // allways
		allPuzzles[currentPuzzleID].guesses[7] = solutionByID[currentPuzzleID]
		if (currentPuzzleID < numPuzzles - 1) { // normal case
			currentPuzzleID = currentPuzzleID + 1
		}
	}
	if (key == 'Backspace') {
		if (currentPuzzleID == numPuzzles - 1 && allPuzzles[currentPuzzleID].finished) {
			// do nothing
		} else {
			if (currentPuzzleID > 0) { // normal case
				currentPuzzleID = currentPuzzleID - 1
			}
		}
		allPuzzles[currentPuzzleID].finished = false
		allPuzzles[currentPuzzleID].guesses[7] = '?????'
	}
	if (allValidLetters.indexOf(key.toLowerCase()) != -1) {
		console.log(`Guess ${key.toUpperCase()}`)
	}
	updateDOMFromPuzzleStates(allPuzzles)
}
//////////////////////////// USER ALL-TIME VIEW /////////////////////
//// ALL-TIME view or LEAGUE view?
// TODO: login a user, provide anonymous view
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams
// init state for league
let userID = 'this-session'
// init DOM for league
d3.select("#wordle-league").style('text-align', 'center').text('')
d3.select("#wordle-league")
	.append('div')
	.text("This 7 puzzle Challenge is unique to this browser session.")
d3.select("#wordle-league")
	.append('div').style('margin-bottom','32px')
	.text("Do not close tab until solved.")

//////////////////////// CHALLENGE ///////////////////////////////////////
// init challenge state. A challenge is a set of 7 or 30 games with pre-selected solution order to compete among diff users
// TODO: offer choice of word set. Defaulting to original
// TODO: save state per user, currently just per session
// TODO: bind games to fixed time periods (assume local Day)
// TODO: What is best practice way to avoid so many globals?
let challengeID = 'session-only'
let sharedStartWordMode = true // only handle this case for now
let numPuzzles = 7 // TODO: enable 7 or 30 and defining set of players in Challenge, eventually allow sets of team
let currentPuzzleID = 0
let possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
let allValidWords = possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)
let allValidLetters = "abcdefghijklmnopqrstuvwxyz"
let solutionByID = removeRandomSubset(possibleSolutionWords, numPuzzles)
let startWordByID = sharedStartWordMode ? removeRandomSubset(possibleSolutionWords, numPuzzles) : []

// done with challenge state initialized

// init DOM for Challenge
d3.select("#wordle-league").append('div').attr('class','wordle-challenge')
	.style('display', 'flex')
	.style('justify-content', 'center')
	.style('align-items', 'center')
	.style('flex-direction', 'column')
	//.style('overflow', 'hidden') // TODO: lookup why this was used in NYT Wordle
//////////////////////////// PUZZLE ///////////////////////////////////////
// init state for all puzzles
let allPuzzles = []
for (let i=0; i < numPuzzles; i++) {
	// init new puzzle state
	let puzzle = {
		ID: i, // ID puzzles as 0-6
		startWord: startWordByID[i],
		guessWords: ['     ', '     ', '     ', '     ', '     ', '     '],
		cursorPos: {guessRow:0, letterCol: sharedStartWordMode ? 5 : 0},
		// cursorPos.letterCol == 0 is waiting for the first letterCol of the guess, == 4 is waiting for the fifth letter
		// cursorPos.letterCol == 5 means you have entered 5 letters but not pressed 'Enter' or 'Backspace' yet
		solution: solutionByID[i],
		finished: false,
	}
	
	if (sharedStartWordMode) {
		puzzle.guessWords = [puzzle.startWord].concat(puzzle.guessWords) // get an extras guess when forced to use a shared start word
	}
	puzzle.maxGuesses = puzzle.guessWords.length // convenience variable
	puzzle.finalScore = puzzle.maxGuesses + 2 // default to failure which is max guesses + 2
	
	allPuzzles.push(puzzle)
}

// init DOM for puzzles
updateDOMFromPuzzleStates(allPuzzles) // this is also called later from anything that changes puzzle state such as event handlers

d3.select('body').on('keydown', (e) => updatePuzzle(e.key))
// event listener drives the game from here on