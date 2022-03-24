'use strict'
// useful global functions specific to most wordle puzzle variations

const allValidLetters = "abcdefghijklmnopqrstuvwxyz".split('')
const possibleSolutionWords = Array.from(WORDum_SET.possibleSolutionWords)
const allValidWords = WORDum_SET.possibleSolutionWords.concat(WORDum_SET.otherValidWords)

// I want IDs to be short so they are easier to share
// So only pick 64 offset patterns and start them on random indexes
// this makes ~ 150,000 different challenges.
// So effectively random as in unguessable but with a manageable length ID
// each entry in randomOffsets supports 31 offsets allowing up to 32 solution words
// still able to encode numPuzzles + 32*mode into a single base64 Char
// 33 possible random offsets keeps

const encodeChallengeIDToVersionB = (challenge) => {
	let {
		numPuzzles,
		sharedStartWordMode,
		solutionStartIndex,
		solutionOffsetsIndex,
	} = challenge

	let version = 'B'
		// version 'B' encodes more options in fewer URL safe characters
		// possibleID[0] = 'B' a.k.a. safeForURLBase64Alphabet[1] 
		// possibleID[1]..[4] = base64 encoded
		//     4 chars [1]..[4] decodes to 3 binary string bytes
		//     use full 'binary string' 8 bits per char = 24bits
		//     bits 0..4   = numPuzzles, 5 bits allows 1..32 numPuzzles
		//     bit 5       = sharedStartWordMode, 1 bit = true or false
		//     bits 6..17  = solutionStartIndex, 12 bits = max 4096 solutions (about ~2300 today)
		//     bits 18..23 = solutionOffsetsIndex, 6 bits = max 64 possible offset sequences

	let n = 0
	n = n + (2**0)  * (numPuzzles - 1) // map numPuzzles 1..32 to 0..31
	n = n + (2**5)  * (sharedStartWordMode ? 1 : 0)
	n = n + (2**6)  * (solutionStartIndex)
	n = n + (2**18) * (solutionOffsetsIndex)
	if (n >= 2**24) {
		throw new Error('encoding to version B values too large??')
	}

	let binaryString = ''
	binaryString = binaryString + String.fromCharCode(n % 256)
	n = Math.floor(n /256)
	binaryString = binaryString + String.fromCharCode(n % 256)
	n = Math.floor(n /256)
	binaryString = binaryString + String.fromCharCode(n % 256)
	
	return version + encodeToURLSafeBase64(binaryString)
}

const encodeChallengeID = encodeChallengeIDToVersionB

const decodeChallengeID = (possibleID) => {
	const c = {} // an object with a subset of saved properties to return
	let scratch
	let num

	if (!possibleID || !possibleID.length) {
		return {} // reject this possibleID
	}

	const version = possibleID[0] // first character is version of challenge ID encoding
	if (version == 'A') {
		// decode format version 'A' a.k.a. safeForURLBase64Alphabet[0] 
		return {} // DEPRECATED because I changed randomOffsets[]
	} else if (version == 'B') {
		// decode format version 'B' a.k.a. safeForURLBase64Alphabet[1] 
		// version 'B' encodes more options in fewer URL safe characters
		if (possibleID.length != 5) {
			return {} // reject if wrong length
		}
		// possibleID[0] = 'B' a.k.a. safeForURLBase64Alphabet[1] 
		// possibleID[1]..[4] = base64 encoded
		//     4 chars [1]..[4] decodes to 3 binary string bytes
		//     use full 'binary string' 8 bits per char = 24bits
		//     bits 0..4   = numPuzzles, 5 bits allows 1..32 numPuzzles
		//     bit 5       = sharedStartWordMode, 1 bit = true or false
		//     bits 6..17  = solutionStartIndex, 12 bits = max 4096 solutions (about ~2300 today)
		//     bits 18..23 = solutionOffsetsIndex, 6 bits = max 64 possible offset sequences
		scratch = decodeFromURLSafeBase64(possibleID.slice(1))
		if (!scratch || scratch.length != 3) {
			return {}
		}
		num = scratch.charCodeAt(0) + 256*scratch.charCodeAt(1) + 256*256*scratch.charCodeAt(2)

		c.numPuzzles             = num % (2** 5) + 1 // 5 bits and map 0..31 -> 1..32
		num           = Math.floor(num / (2** 5))

		c.sharedStartWordMode    = num % (2** 1) ? true : false // 1 bit and map 1:0 to true:false explicitly
		num           = Math.floor(num / (2** 1))

		c.solutionStartIndex     = num % (2**12) // 12 bits - must check later for limit
		num           = Math.floor(num / (2**12))
		
		c.solutionOffsetsIndex   = num % (2** 6) // 6 bits - all values allowed
		//num                      = Math.floor(num / (2** 6))

		// check that values are currently supprted
		if (c.numPuzzles > 5) return {} // only support 1-5 puzzles now
		if (c.sharedStartWordMode) return {} // don't support this mode yet
		if (c.solutionStartIndex >= possibleSolutionWords.length) return {} // don't support different word sets yet
		// solutionOffsetsIndex all 0..63 possible values are allowed
	} else {
		// do not know how to decode this version
		console.warn('Unrecognized chalengeID version in URL', possibleID)
		return {} // reject this possibleID
	}

	return c
}

class WordumChallenge {
// 
	constructor(possibleID) {
		// make a default challenge object to be overwritten by values coded in possibleID
		this.numPuzzles = 3 //5
		this.sharedStartWordMode = false // this mode does not make sense until I code hard mode and harder mode

		// pick indexes for the random words
		this.solutionStartIndex = randomIndex(possibleSolutionWords.length)
		this.solutionOffsetsIndex = randomIndex(randomOffsets.length)

		this.startWordStartIndex = randomIndex(possibleSolutionWords.length - this.numPuzzles)
		this.startWordOffsetsIndex = randomIndex(randomOffsets.length)

		// now overwrite with values including ID encoded in possibleID if any
		const savedChallengeEntries = decodeChallengeID(possibleID) || {}
		// if possibleID was invalid then this loop won't execute, this will be untouched
		for (const [key, value] of Object.entries(savedChallengeEntries)) {
			this[key] = value
		}

		this.ID = encodeChallengeID(this)

		// now construct rest of challenge object derivable from existing entries
		this.nowPuzzleID = 0
		this.keyboardHints = {}

		this.solutionOffsets = randomOffsets[this.solutionOffsetsIndex].slice(0,this.numPuzzles-1)
			.map((n) => this.solutionStartIndex + n)
		this.solutionIndexes = [0, ...this.solutionOffsets].map((i) => i + this.solutionStartIndex) // shift all indexes by startIndex
		this.startWordOffsets = randomOffsets[this.startWordOffsetsIndex].slice(0,this.numPuzzles-1)
			.map((n) => this.startWordStartIndex + n)
		this.startWordIndexes = [0, ...this.startWordOffsets].map((i) => i + this.startWordStartIndex) // shift all indexes by startIndex
		this.solutionByID = removeSubsetAtIndexes(possibleSolutionWords, this.solutionIndexes)
		this.startWordByID = removeSubsetAtIndexes(possibleSolutionWords, this.startWordIndexes)

		this.puzzles = new Array(this.numPuzzles).fill(true).map((x_, i) => {
			// init new single puzzle state
			// TODO: refactor this into new WordumPuzzle(ID)
			const puzzle = {
				ID: i, // ID puzzles as 0..(numPuzzles-1)
				startWord: this.startWordByID[i],
				allGuesses: new Array(6).fill(true).map( // 6 rows/guesses
					(x,i) => new Array(5).fill(true).map( // of 5 letter/hint objects in each row/guess
						(x, i) => ({letter: '', hint: 'tbd'})
					)
				),
				maxGuesses: undefined,
				cursorPos: {guessRow:0, letterCol: this.sharedStartWordMode ? 5 : 0},
				// cursorPos.letterCol == 0 is waiting for the first letterCol of the guess, == 4 is waiting for the fifth letter
				// cursorPos.letterCol == 5 means you have entered 5 letters but not pressed 'Enter' or 'Backspace' yet
				solution: this.solutionByID[i],
				finished: false,
				finalGuessCount: undefined,
			}

			if (this.sharedStartWordMode) {
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
	}
}

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
		if (tile.hint == 'empty') {console.error(`hint type 'empty' is DEPRECATED`)}
		if (!tile.hint || tile.hint == 'tbd') { // only if it hasn't been marked yet
			const pos = testSolution.indexOf(tile.letter)
			if (pos != -1) { // if found - prioritize correct over present over absent
				tile.hint = 'present'
				testSolution[pos] = '.' // mark/remove this to make double letters work
				if (kbdHints[tile.letter] != 'correct') {
					kbdHints[tile.letter] = 'present'
				}
			} else {
				tile.hint = 'absent'
				if (kbdHints[tile.letter] != 'correct' && kbdHints[tile.letter] != 'present') {
					kbdHints[tile.letter] = 'absent'
				}
			}
		}
	})

	return true
	// return true means guess was a valid word and puzzle should advance to next guess or record a win
}

//	TODO: refactor this into a method on Challenge
const updateChallengeFromKey = (challenge, key_) => {
	// convenience renaming
	let {
		puzzles,
		nowPuzzleID: ID,
		numPuzzles,
		sharedStartWordMode,
	} = challenge
	const key = (key_ == '←') ? 'backspace' : key_.toLowerCase() // normalize input key_
	const puzzle = puzzles[ID]
	let {
		guessRow: row,
		letterCol: col,
	} = puzzle.cursorPos
	const tiles = puzzle.allGuesses[row]
	// a tile is a letter+hint object. plural tiles is one word/guess of 5 tiles 
	if (ID < numPuzzles) { // if challenge isn't finished with all puzzles
		if (col == tiles.length && key == 'enter') { // only process Enter key at end of row
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
				challenge.keyboardHints = {}
				// allValidLetters.split('').forEach(letter => challenge.keyboardHints[letter] = 'tbd' )
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
						puzzles[ID].cursorPos = { // update here because only puzzles[old ID] gets updated at end of function
							guessRow:0,
							letterCol: sharedStartWordMode ? 5 : 0,
						}
					}
					// reset keyboard hints
					challenge.keyboardHints = {}
				}
			} // ignore 'Enter' if guess is not valid, wait for 'Backspace'
		} else if (col > 0 && (key == 'backspace' || key == '←')) {
			col--
			tiles[col].letter = ''
			assignHint(tiles, 'tbd') // overkill = clears the invalid guess case
		} else if (col < tiles.length
				&& allValidLetters.indexOf(key.toLowerCase()) != -1) {
			tiles[col].letter = key
			col++
		}
	}
	// re-assign primitives that could have changed before returning
	challenge.nowPuzzleID = ID
	puzzle.cursorPos = {guessRow: row, letterCol: col,} // this updates the puzzles[old ID]. if ID has advanced must update above
}

const updateGame = (...args) => {
	updateChallengeFromKey(...args)
}
