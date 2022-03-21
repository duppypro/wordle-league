'use strict'
///////////////////////// WORDLE UI FUNCTIONS //////////////////
const beat = 666 //333 // for animations speed, units are in msec

const createKeyboardD3Selection = (selKeyboard) => {
	const sel = selKeyboard.append('div').attr('id','keyboard')
	let keys
	let selRow

	// top row QWERTYUIOP
	keys = Array.from("qwertyuiop")
	selRow = sel.append('div').attr('class','row')
	keys.forEach((key) => {
		selRow.append('button').attr('hint','tbd').text(key)
	})

	// middle row ASDFGHJKL
	keys = Array.from("asdfghjkl")
	selRow = sel.append('div').attr('class','row')
	selRow.append('div')
		.attr('class','half')
	keys.forEach((key) => {
		selRow.append('button').attr('hint','tbd').text(key)
	})
	selRow.append('div')
		.attr('class','half')

	// bottom row Enter-ZXCVBNM-Backspace
	keys = Array.from("zxvcbnm")
	selRow = sel.append('div').attr('class','row')
	selRow.append('button')
		.attr('class','one-and-a-half').text('Enter')
	keys.forEach((key) => {
		selRow.append('button').attr('hint','tbd').text(key)
	})
	selRow.append('button')
		.attr('class','one-and-a-half').text('←')
		.style('font-size','18px')
}

const drawKeyboardHintsFromChallenge = (selChallenge, challenge) => {
	selChallenge.selectAll('#keyboard button').each(function () {
		d3.select(this).attr('hint', challenge.keyboardHints[this.innerText.toLowerCase()])
	})
}

const updateD3SelectionFromChallenge = (selChallenge, challenge) => {
	let { // convenience renaming
		puzzles,
		nowPuzzleID,
		numPuzzles,
	} = challenge

	// Update Title and game unique ID
	d3.select('#game-app header') // TODO: don't update every time, only when ID changes
	.html(
		`<div class="title">Wordle Challenge</div>`
		+ `<div class='uid'>${challenge.ID}</div>`
	)

	// create DOM elements for keyboard and attach touch listeners if it doesn't exist yet
	if (selChallenge.select('#challenge-keyboard').select('*').empty()) {
		createKeyboardD3Selection(selChallenge.select('#challenge-keyboard'))
	}
	drawKeyboardHintsFromChallenge(selChallenge, challenge)

	// Update progress and final score
	/* Example of a Wordle share
	Wordle 274 2/6

⬛🟨🟨⬛⬛
🟩🟩🟩🟩🟩
	*/
	selChallenge.select('#challenge-score')
		.html(
			`<div class="score-as-emoji">`
			+ `🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩<br>`
			+ `🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩<br>`
			+ `🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩<br>`
			+ `🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩<br>`
			+ `🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩&nbsp;&nbsp;🟩🟨⬛🟥🟩<br>`
			+ `🟥🟥🟥🟥🟥&nbsp;&nbsp;🟥🟥🟥🟥🟥&nbsp;&nbsp;🟥🟥🟥🟥🟥&nbsp;&nbsp;🟥🟥🟥🟥🟥&nbsp;&nbsp;🟥🟥🟥🟥🟥`
			+`</div>`
			+ `Progress: ${nowPuzzleID} of ${numPuzzles}`
			+ `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Final Score: ${
				nowPuzzleID == numPuzzles // are all puzzles scored yet?
					? puzzles.reduce((sum, p) => sum + p.finalGuessCount, 0) / numPuzzles // average of all guess counts
					: '-' // or nothing if still in progress
			}`	
		)

	// always recreate this because both DOM and puzzles might have changed
	selChallenge
		.select("#challenge-puzzles")
		.style('height', `${17 + (5+48+2+2)*(puzzles.reduce((max, p) => Math.max(max, p.maxGuesses),0))}px`)
		.selectAll('div.puzzle-container')  // NYT Wordle calls this 'div#game div#board-container div#board'
		.data(puzzles, puzzle => puzzle.ID) // make a puzzle element for each puzzle in this challenge
		.join(
			enter => {
				const selContainer = enter.append('div').attr('class', 'puzzle-container')
				// selContainer.append('div').attr('class', 'puzzle-score')
				selContainer.append('div').attr('class', 'puzzle')
					.style('grid-template-rows', puzzle => `repeat(${puzzle.maxGuesses}, 1fr)`)
				selContainer
					.style('left', puzzle => `${42 + 360*(1 + puzzle.ID - nowPuzzleID)}px`)
				return selContainer
			},
			old => old,
			exit => exit // NOTE: these never exit yet - untested
				.transition().duration(2*beat).style('left','-360px').delay(beat/2)
				.on('end', function () {this.parentElement.remove()}), // remove the parent puzzle-container
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.filter(d => {
			//only apply transitions if the target has changed
			return d.targetPuzzleID != nowPuzzleID
		})
			.transition()
				.each(d => {
					// mark this element as on the way to its target new position
					d.targetPuzzleID = nowPuzzleID
				})
				.duration(2*beat)
				.style('left', puzzle => `${42 + 360*(puzzle.ID - nowPuzzleID)}px`)
			.delay(beat/2)
		// TODO: the 30 and 360 are hard-coded, should be computed from game width
	selChallenge
		.selectAll('div.puzzle-score').html(puzzle => 
			`Puzzle <bold>#${puzzle.ID+1}</bold>`
			+ `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Score: ${puzzle.finished ? puzzle.finalGuessCount : puzzle.cursorPos.guessRow}/${puzzle.maxGuesses}`
		)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update all the guess rows
	selChallenge.selectAll('div.puzzle').each(function (puzzle) { // can't use => notation because we need 'this' to get set
		//this is called for each div.puzzle DOM element
		//puzzleState (puzzle)
		d3.select(this).selectAll('div.game-row')
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join(
				enter => enter // this is called once for every element in puzzle.allGuesses array that does not have a matching DOM yet
					.append('div').attr('class','game-row')
					.append('div').attr('class','row'),
				old => old, // this
				exit => exit,
				)
			// now for all entered and old guess rows create letters
			.each(function (guessRow) {
				d3.select(this).selectAll('div.game-tile div.tile')
				.data(guessRow)
				.join(
					enter => enter
						.append('div').attr('class','game-tile')
						.append('div').attr('class','tile'),
					old => old,
					exit => exit,
				)
				// update all here because .join() returns merge of enter() and old()
				.text(tile => tile.letter)
				.attr('hint', tile => tile.hint)
				// .style('background-color', tile => hintColor[tile.hint]) // d3js.style() does not accept an object anymore
			})
	}) // end selPuzzles.each()

	// NOTE: overkill - update all hints here so they show even on exiting DOM elements.  Optimize later
	selChallenge.select("#challenge-puzzles").selectAll('div.game-tile div.tile')
		.text(tile => tile.letter)
		.attr('hint', tile => tile.hint)

}
