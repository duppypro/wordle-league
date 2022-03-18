'use strict'
// play Wordle competitevly with a forced random first guess

//////////////////////////// USER ALL-TIME VIEW /////////////////////
//// ALL-TIME view or LEAGUE view?
// TODO: login a user, provide anonymous view
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams
// init state for league
let userID = 'this-session' // no user login yet
// init DOM for league
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
	numPuzzles: 5, // TODO: refactor to make this configurable
	sharedStartWordMode: false,
}
challenge.puzzles = new Array(challenge.numPuzzles).fill(true)
challenge.solutionByID = removeRandomSubset(possibleSolutionWords, challenge.numPuzzles),
challenge.startWordByID = challenge.sharedStartWordMode ? removeRandomSubset(possibleSolutionWords, challenge.numPuzzles) : []
// challenge state init complete

// init DOM for Challenge
const selChallenge = d3.select('#challenge') // TODO: this references DOM?  move this to wordle-DOM-UI module? or is this the right place because this is where both update DOM and update state functions are called?

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
				(x, i) => ({letter: '', hint: 'empty'})
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
challenge.keyboardHints = {}
allValidLetters.split('').forEach(letter => challenge.keyboardHints[letter] = 'tbd' )

// init DOM for puzzles
updateDOMFromChallenge(selChallenge, challenge)
// must call this once to init presentation, then this is also called later from anything that changes puzzle state such as event handlers

const updateChallengeOnKeydown = (e) => {
	updateChallengeFromKey(challenge, e.key)
	updateDOMFromChallenge(selChallenge, challenge)
}

const updateChallengeOnMousedown = (e) => {
	const key = e && e.toElement && e.toElement.innerText
	if (key) {
		updateChallengeFromKey(challenge, key) // updates state only
		updateDOMFromChallenge(selChallenge, challenge) // updates UI only
	}
}
d3.select('body').on('keydown', updateChallengeOnKeydown)
d3.select('#keyboard').on('mousedown', updateChallengeOnMousedown)
// event listener drives the game from here on