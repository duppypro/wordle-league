'use strict'
// play Wordle competitevly with a forced random first guess

///////////////////////// WORDLE UI FUNCTIONS //////////////////
const updateChallengeDOMFromChallenge = (selChallenge, challenge) => {
	// convenience renaming
	let {puzzles, currentPuzzleID, numPuzzles, sharedStartWordMode} = challenge // TODO: refactor globals like sharedStartWordMode and others?

	// Update progress and final score
	selChallenge.select('.wordle-challenge-score')
		.text(
			`|| This Challenge Progress: ${currentPuzzleID}/${numPuzzles} |||||| `
			+ `Final Score (average guesses): ${puzzles.reduce((sum, p)=>(sum.finalGuessCount||sum) + p.finalGuessCount) / numPuzzles} ||`	
		)

	// always recreate this because both DOM and puzzles might have changed
	let selPuzzles = selChallenge.selectAll('div.wordle-puzzle')  // NYT Wordle calls this 'div#game div#board-container div#board'
		.data(puzzles) // make a puzzle element for each puzzle in this challenge
		.join(
			enter => enter
				.append('div').attr('class', 'wordle-puzzle')
				.style('text-align', 'center').style('width','350px')
				.style('height', sharedStartWordMode ? '670px' : '600px'), // create puzzle boards that are new to the array allPuzzles
			old => old,
			exit => exit
				.transition().duration(340).style('opacity',0).remove()
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.text(puzzle => 
			`Puzzle #${puzzle.ID+1} ||`
			+ ` Guesses: ${puzzle.cursorPos.guessRow} /`
			+ ` Final Score: ${puzzle.finished ? puzzle.finalGuessCount : '-'} of ${puzzle.maxGuesses}`
		)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update 6 or 7 guess rows
	selPuzzles.each((puzzle, i, nodes) => { //this is called for each div.wordle-puzzle DOM element
		//puzzleState (puzzle)
		d3.select(nodes[i]).selectAll('div.guessRow') // NYT Wordle calls this 'game-row.row'
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join(
				enter => enter // this is called once for every element in puzzle.allGuesses array that does not have a matching DOM yet
					.append('div').attr('class','guessRow')
					.style('display', 'grid')
					.style('grid-template-columns', 'repeat(5, 1fr)')
					.style('grid-gap', '5px'),
				old => old, // this
				exit => exit
					.transition().duration(340).style('opacity',0).remove()
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
					.transition().duration(340).style('opacity',0).remove()
				)
				// update all here because .join() returns merge of enter() and old()
				.text(tile => tile.letter)
				.style('background-color', tile => hintColor[tile.hint]) // d3js.style() does not accept an object anymore
			})
	}) // end selPuzzles.each()
}

//////////////////////////// USER ALL-TIME VIEW /////////////////////
//// ALL-TIME view or LEAGUE view?
// TODO: login a user, provide anonymous view
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams
// init state for league
let userID = 'this-session' // no user login yet
// init DOM for league
const selLeague = d3.select("#wordle-league")

//////////////////////// CHALLENGE ///////////////////////////////////////
// init challenge state. A challenge is a set of 7 or 30 games with pre-selected solution order to compete among diff users
// TODO: offer choice of word set. Defaulting to original
// TODO: save state per user, currently just per session
// TODO: bind games to fixed time periods (assume local Day)
// TODO: What is best practice way to avoid so many globals?
let challengeID = 'session-only' // only one challenge per session now
// challenge options
let challenge = { // TODO: refactor this to use new WordleChallenge(options)
	currentPuzzleID: 0,
	numPuzzles: 7, // TODO: refactor to make this configurable
	sharedStartWordMode: true, // only handle this case for now
}
challenge.puzzles = new Array(challenge.numPuzzles).fill(true)
challenge.solutionByID = removeRandomSubset(possibleSolutionWords, challenge.numPuzzles),
challenge.startWordByID = challenge.sharedStartWordMode ? removeRandomSubset(possibleSolutionWords, challenge.numPuzzles) : []
// challenge state init complete

// init DOM for Challenge
const selLeagueTitle = selLeague.text('') // erase loading message
	.style('font-family', 'Clear Sans, Helvetica Neue, Arial, sans-serif')
	.append('div').style('margin-bottom','2em') 
selLeagueTitle.append('div').text("This 7 puzzle Challenge is unique to this browser session.")
selLeagueTitle.append('div').text("Do not close tab until solved.")

const selChallenge = selLeague
.append('div').attr('class','wordle-challenge')
.style('display', 'flex').style('justify-content', 'center')
.style('align-items', 'center').style('flex-direction', 'column')
//.style('overflow', 'hidden') // TODO: lookup why this was used in NYT Wordle

selChallenge.append('div').text('=======================================================')
selChallenge.append('div').attr('class','wordle-challenge-score')
selChallenge.append('div').text('=======================================================')
	.style('margin-bottom','2em')

//////////////////////////// PUZZLE ///////////////////////////////////////
// init state for all puzzles
challenge.puzzles = challenge.puzzles.map((x, i) => {
	// init new single puzzle state
	// TODO: refactor this into new WordlePuzzle(ID)
	let puzzle = {
		ID: i, // ID puzzles as 0..(numPuzzles-1)
		startWord: challenge.startWordByID[i],
		allGuesses: new Array(6).fill(true).map( // 6 rows/guesses
			(x,i) => new Array(5).fill(true).map( // of 5 letter/hint objects in each row/guess
				(x, i) => ({letter: '', hint: 'tbd'})
			)
		),
		maxGuesses: undefined,
		cursorPos: {guessRow:0, letterCol: challenge.sharedStartWordMode ? 5 : 0},
		// cursorPos.letterCol == 0 is waiting for the first letterCol of the guess, == 4 is waiting for the fifth letter
		// cursorPos.letterCol == 5 means you have entered 5 letters but not pressed 'Enter' or 'Backspace' yet
		solution: challenge.solutionByID[i],
		finished: false,
		finalGuessCount: undefined,
	}
	
	if (challenge.sharedStartWordMode) {
		// put a random start word as the first guess
		puzzle.allGuesses = [
			new Array(5).fill(true).map((x, i) => ({letter: puzzle.startWord[i], hint: 'tbd'})),
			...puzzle.allGuesses,
		]
		// get an extras guess when forced to use a shared start word
	}
	puzzle.maxGuesses = puzzle.allGuesses.length // convenience variable
	puzzle.finalGuessCount = puzzle.maxGuesses + 2 // default to failure which is max guesses + 2
	
	return puzzle
})

// init DOM for puzzles
updateChallengeDOMFromChallenge(selChallenge, challenge)
// must call this once to init presentation, then this is also called later from anything that changes puzzle state such as event handlers

const updateChallengeOnKeydown = (e) => {
	updateChallengeFromKey(challenge, e.key)
	updateChallengeDOMFromChallenge(selChallenge, challenge)
}
const updateChallengeOnMousedown = (e) => {
	console.log('mousedown event', e)
	// TODO: from mouse down on element in keyboard element figure out a key
	const key = ' '
	updateChallengeFromKey(challenge, key) // updates state only
	updateChallengeDOMFromChallenge(selChallenge, challenge) // updates UI only
}
d3.select('body').on('keydown', updateChallengeOnKeydown)
//d3.select('body').on('mousedown', updateChallengeOnMousedown)
// event listener drives the game from here on