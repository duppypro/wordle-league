'use strict'
// useful functions specific to most wordle puzzle variations

const assignHintsCheckSolution = (tiles, solution) => {
	// first check if its a valid word
	const guessAsString = tiles.map((tile) => tile.letter).join('')
	if (allValidWords.indexOf(guessAsString) == -1) {
		assignHints(tiles, 'invalid')
		return false // return false indicates it was hinted as invalid and puzzle should not advance to next guess
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

	return true // return true means guess was a valid word and puzzle should advance to next guess or record a win
}

const assignHints = (tiles, hint) => {
	// set the hint property of all tiles to hint parameter
	tiles.map((tile) => tile.hint = hint)
}
