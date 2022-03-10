'use strict'
// play Wordle competitevly with a forced random first guess

///////////////////////// WORDLE FUNCTIONS //////////////////
const updateChallengeDOMFromPuzzleStates = (allPuzzles) => {
	let selPuzzles = selChallenge.selectAll('div.wordle-puzzle')  // NYT Wordle calls this 'div#game div#board-container div#board'
		.data(allPuzzles) // make a puzzle element for each puzzle in this challenge
		.join(
			enter => enter
				.append('div').attr('class', 'wordle-puzzle')
				.style('text-align', 'center')
				.style('width','350px')
				.style('height', sharedStartWordMode ? '670px' : '600px'), // create puzzle boards that are new to the array allPuzzles
			old => old,
			exit => exit
				.transition().duration(677).style('opacity',0).remove()
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.text(puzzle => 
			`Puzzle #${puzzle.ID+1} ||`
			+ ` Guesses: ${puzzle.cursorPos.guessRow} /`
			+ ` Final Score: ${puzzle.finished ? puzzle.finalScore : '-'} of ${puzzle.maxGuesses}`
		)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update 6 or 7 guess rows
	selPuzzles.each((puzzle, i, nodes) => { //this is called for each div.wordle-puzzle
		//puzzleState (puzzle)
		d3.select(nodes[i]).selectAll('div.guessRow') // NYT Wordle calls this 'game-row.row'
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
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
			// now for all entered and old guess rows create letters
			.each((guessRow, i, nodes) => {
				d3.select(nodes[i]).selectAll('div.letterBox div.guessLetter') // NYT Wordle calls this 'game-tile div.tile'
				.data(guessRow)
				.join(
					enter => enter
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
							.style('text-transform','uppercase'),
					old => old,
					exit => exit
					.transition().duration(339).style('opacity',0).remove()
					)
					// update all here because .join() returns merge of enter() and old()
					.text(tile => tile.letter)
					.style('background-color', tile => hintColor[tile.hint])
				})
	}) // end selPuzzles.each()
	return selPuzzles
}

const updatePuzzleFromKey = (key) => {
	if (key == 'Enter') {
		if (allPuzzles[currentPuzzleID].finished == false) {
			allPuzzles[currentPuzzleID].finished = true
			const testSolution = allPuzzles[currentPuzzleID].solution.slice().split('') // make a copy as an array of letters
			const tiles = allPuzzles[currentPuzzleID].allGuesses[allPuzzles[currentPuzzleID].cursorPos.guessRow]
			// mark correct letters first and remove them from solution so double letter present works
			for (let i=0; i < 5; i++) {
				if (tiles[i].letter == testSolution[i]) { // if in the same position
					tiles[i].hint = 'correct'
					testSolution[i] = '?' // clear this to make double letters work
				}
			}
			// now mark absent and present
			for (let i=0; i < 5; i++) {
				if (tiles[i].hint == 'tbd') { // only if it hasn't been marked yet
					const pos = testSolution.indexOf(tiles[i].letter)
					if (pos == -1) { // if not found
						tiles[i].hint = 'absent'
					} else {
						tiles[i].hint = 'present'
						testSolution[pos] = '?' // clear this to make double letters work
					}
				}
			}
		}
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

	// Now update the DOM to match the challenge / puzzle state
	updateChallengeDOMFromPuzzleStates(allPuzzles)
}
//////////////////////////// USER ALL-TIME VIEW /////////////////////
//// ALL-TIME view or LEAGUE view?
// TODO: login a user, provide anonymous view
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams
// init state for league
let userID = 'this-session'
// init DOM for league
let selLeague = d3.select("#wordle-league").style('text-align', 'center').text('')

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
const hintColor = {
	tbd: 'black',
	absent: '#3a3a3c',
	present: '#b59f3b',
	correct: '#538d4e'
}

// done with challenge state initialized

// init DOM for Challenge
let selChallenge = selLeague
	.append('div')
		.text("This 7 puzzle Challenge is unique to this browser session.")
		.append('div').style('margin-bottom','32px')
		.text("Do not close tab until solved.")
		.append('div').attr('class','wordle-challenge')
		.style('display', 'flex')
		.style('justify-content', 'center')
		.style('align-items', 'center')
		.style('flex-direction', 'column')
		//.style('overflow', 'hidden') // TODO: lookup why this was used in NYT Wordle

//////////////////////////// PUZZLE ///////////////////////////////////////
// init state for all puzzles
let allPuzzles = new Array(numPuzzles).fill(true).map((x, i) => {
	// init new single puzzle state
	let puzzle = {
		ID: i, // ID puzzles as 0..(numPuzzles-1)
		startWord: startWordByID[i],
		allGuesses: new Array(6).fill(true).map( // 6 rows/guesses
			(x,i) => new Array(5).fill(true).map( // of 5 letter/hint objects in each row/guess
				(x, i) => ({letter: '', hint: 'tbd'})
			)
		),
		maxGuesses: undefined,
		cursorPos: {guessRow:0, letterCol: sharedStartWordMode ? 5 : 0},
		// cursorPos.letterCol == 0 is waiting for the first letterCol of the guess, == 4 is waiting for the fifth letter
		// cursorPos.letterCol == 5 means you have entered 5 letters but not pressed 'Enter' or 'Backspace' yet
		solution: solutionByID[i],
		finished: false,
		finalScore: undefined
	}
	
	if (sharedStartWordMode) {
		// Array.unshift() adds the start word to the front of the list
		puzzle.allGuesses.unshift(new Array(5).fill(true).map(
			(x, i) => ({letter: puzzle.startWord[i], hint: 'tbd'})
		)) // get an extras guess when forced to use a shared start word
	}
	puzzle.maxGuesses = puzzle.allGuesses.length // convenience variable
	puzzle.finalScore = puzzle.maxGuesses + 2 // default to failure which is max guesses + 2
	
	return puzzle
})

// init DOM for puzzles
updateChallengeDOMFromPuzzleStates(allPuzzles) // this is also called later from anything that changes puzzle state such as event handlers

const updatePuzzleOnKeydown = (e) => {
	updatePuzzleFromKey(e.key)
}
const updatePuzzleOnMousedown = (e) => {
	console.log('mousedown event', e)
	// TODO: from mouse down on element in keyboard element figure out a key
	const key = ' '
	updatePuzzleFromKey(key)
}
d3.select('body').on('keydown', updatePuzzleOnKeydown)
d3.select('body').on('mousedown', updatePuzzleOnMousedown)
// event listener drives the game from here on