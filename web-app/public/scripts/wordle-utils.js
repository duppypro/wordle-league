'use strict'
// useful global functions specific to most wordle puzzle variations

const hintColor = { // TODO: move colors to CSS make this an attribute
	invalid: '#3a0a0a',
	tbd: 'black',
	empty: 'black',
	absent: '#3a3a3c',
	present: '#b59f3b',
	correct: '#538d4e',
}

const allValidLetters = "abcdefghijklmnopqrstuvwxyz"
const possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
const allValidWords = WORDLE_SET_FROM.OG.possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)

const assignHint = (tiles, hint) => {
	// set the hint property of all tiles to hint parameter
	tiles.forEach(tile => tile.hint = hint)
}

const assignHintsFromSolution = (tiles, solution, kbdHints) => {
// primary purpose is to assign hint values
// also returns false if the guess was invalid 

	// first check if its a valid word
	const guessAsString = tiles.map((tile) => tile.letter).join('')
	if (allValidWords.indexOf(guessAsString) == -1) {
		assignHint(tiles, 'invalid')
		return false
		// return false indicates it was hinted as invalid and puzzle should not advance to next guess/row
	}

	const testSolution = solution.slice().split('') // make a copy as an array of letters so they can be marked/removed
	// we don't want to mark or modify the original solution
	// mark correct letters first and mark/remove them from solution so double letter hinting works
	tiles.forEach((tile, i) => {
		if (tile.letter == testSolution[i]) { // if in the same position
			tile.hint = 'correct'
			kbdHints[tile.letter] = 'correct'
			testSolution[i] = '.' // mark/remove this to make double letters work
		}
	})

	// now assign absent and present and remove hinted presents as we go so they only get marked again if there is more than one
	tiles.forEach((tile, i) => {
		if (tile.hint == 'tbd' || tile.hint == 'empty') { // only if it hasn't been marked yet
			const pos = testSolution.indexOf(tile.letter)
			if (pos == -1) { // if not found
				tile.hint = 'absent'
				kbdHints[tile.letter] = 'absent'
			} else {
				tile.hint = 'present'
				kbdHints[tile.letter] = 'present'
				testSolution[pos] = '.' // mark/remove this to make double letters work
			}
		}
	})

	return true
	// return true means guess was a valid word and puzzle should advance to next guess or record a win
}

const updateChallengeFromKey = (challenge, key_) => {
	// convenience renaming
	let {
		puzzles,
		currentPuzzleID: ID,
		numPuzzles,
		sharedStartWordMode,
	} = challenge
	const key = (key_ && key_.length == 1) ? key_.toLowerCase() : key_
	const puzzle = puzzles[ID]
	let {
		guessRow: row,
		letterCol: col,
	} = puzzle.cursorPos
	const tiles = puzzle.allGuesses[row]
	// a tile is a letter+hint object. plural tiles is one word/guess of 5 tiles 
	if (ID < numPuzzles) { // if challenge isn't finished with all puzzles
		if (col == tiles.length
		 && (key == 'Enter' || key == 'ENTER')) { // only process Enter key at end of row
			const valid = assignHintsFromSolution(tiles, puzzle.solution, challenge.keyboardHints)
			const guessAsString = tiles.map(t => t.letter).join('')
			if (guessAsString == puzzle.solution) {
				puzzle.finished = true // does anything read this?
				row++
				puzzle.finalGuessCount = row
				ID = ID + 1
				if (ID < numPuzzles) {
					puzzles[ID].cursorPos = {
						guessRow:0,
						letterCol: sharedStartWordMode ? 5 : 0,
					}
				}
				// win animation here, for now it just fills the remaining rows and nothing happens if no rows left
				let winRow = row
				while (winRow < puzzle.maxGuesses) {
					assignHint(puzzle.allGuesses[winRow], 'correct')
					winRow++
				}
				// reset keyboard hints
				allValidLetters.split('').forEach(letter => challenge.keyboardHints[letter] = 'tbd' )
			} else if (valid) { // normal case
				if (row < puzzle.maxGuesses - 1) {
					row++
					col = 0
				} else { // this was last guess
					puzzle.finished = true // does anything read this?
					row++
					puzzle.finalGuessCount = row + 1 // 1 guess penalty for loss
					ID = ID + 1
					if (ID < numPuzzles) {
						puzzles[ID].cursorPos = {
							guessRow:0,
							letterCol: sharedStartWordMode ? 5 : 0,
						}
					}
				}
			} // ignore 'Enter' if guess is not valid, wait for 'Backspace'
		} else if (col > 0 
			    && (key == 'Backspace' || key == '←')) {
			col--
			tiles[col].letter = ''
			assignHint(tiles, 'tbd') // overkill = clears the invalid guess case
		} else if (col < tiles.length
				&& allValidLetters.indexOf(key.toLowerCase()) != -1) {
			tiles[col].letter = key
			col++
		}
	}
	// assign primitives that could have changed before returning
	challenge.currentPuzzleID = ID
	puzzle.cursorPos = {guessRow: row, letterCol: col,} // this is old puzzle ID
	// NOTE need to handle special case where we advance to next puzzle ID and cursorPos might need to change in old ID and new ID
}
