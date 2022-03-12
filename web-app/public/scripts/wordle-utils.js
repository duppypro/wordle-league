'use strict'
// useful global functions specific to most wordle puzzle variations

const hintColor = { // TODO: move colors to CSS make this an attribute
	invalid: '#3a0a0a',
	tbd: 'black',
	absent: '#3a3a3c',
	present: '#b59f3b',
	correct: '#538d4e',
}

const allValidLetters = "abcdefghijklmnopqrstuvwxyz"
const possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
const allValidWords = possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)

const assignHint = (tiles, hint) => {
	// set the hint property of all tiles to hint parameter
	tiles.map((tile) => tile.hint = hint)
}

const assignHintsFromSolution = (tiles, solution) => {
// primary purpose is to assign hint values
// also returns false if the guess was invalid 

	// first check if its a valid word
	const guessAsString = tiles.map((tile) => tile.letter).join('')
	if (allValidWords.indexOf(guessAsString) == -1) {
		assignHint(tiles, 'invalid')
		return false
		// return false indicates it was hinted as invalid and puzzle should not advance to next guess
	}

	const testSolution = solution.slice().split('') // make a copy as an array of letters so they can be marked/removed
	// we don't want to mark or modify the original solution
	// mark correct letters first and mark/remove them from solution so double letter hinting works
	tiles.map((tile, i) => {
		if (tile.letter == testSolution[i]) { // if in the same position
			tile.hint = 'correct'
			testSolution[i] = '.' // mark/remove this to make double letters work
		}
	})

	// now assign absent and present and remove hinted presents as we go so they only get marked again if there is more than one
	tiles.map((tile, i) => {
		if (tile.hint == 'tbd') { // only if it hasn't been marked yet
			const pos = testSolution.indexOf(tile.letter)
			if (pos == -1) { // if not found
				tile.hint = 'absent'
			} else {
				tile.hint = 'present'
				testSolution[pos] = '.' // mark/remove this to make double letters work
			}
		}
	})

	return true
	// return true means guess was a valid word and puzzle should advance to next guess or record a win
}

const updateChallengeFromKey = (challenge, key) => {
	// convenience renaming
	let {puzzles, currentPuzzleID: ID, numPuzzles} = challenge
	const puzzle = puzzles[ID]
	let {guessRow: row, letterCol: col,} = puzzle.cursorPos
	const tiles = puzzle.allGuesses[row]
	// a tile is a letter+hint object. plural tiles is one word/guess of 5 tiles 
	if (key == 'Enter' && col == tiles.length) { // only process Enter key at end of row
		puzzle.finished = true
		const valid = assignHintsFromSolution(tiles, puzzle.solution)
		if (ID < numPuzzles - 1) { // normal case
			ID = ID + 1
			row, col = 0, 0
		}
	} else if (key == 'Backspace') {
		if (ID == numPuzzles - 1 && puzzle.finished) {
			// do nothing
		} else {
			if (ID > 0) { // normal case
				ID = ID - 1
			}
		}
		puzzle.finished = false
		puzzle.guesses[7] = '?????'
	} else if (allValidLetters.indexOf(key.toLowerCase()) != -1) {
		console.log(`Guess ${key.toUpperCase()}`)
	}
	// assign primitives that could have changed before returning
	challenge.currentPuzzleID = ID
	puzzle.cursorPos = {guessRow: row, letterCol: col,} // this is old puzzle ID
	// NOTE need to handle special case where we advance to next puzzle ID and cursorPos might need to change in old ID and new ID
}
