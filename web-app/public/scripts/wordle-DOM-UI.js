'use strict'
///////////////////////// WORDLE UI FUNCTIONS //////////////////
const beat = 666//333
const updateDOMFromChallenge = (selChallenge, challenge) => {
	// convenience renaming
	let {puzzles, currentPuzzleID, numPuzzles, sharedStartWordMode} = challenge // TODO: refactor globals like sharedStartWordMode and others?

	// Update progress and final score
	selChallenge.select('#challenge-score')
		.html(
			`Progress: ${currentPuzzleID} of ${numPuzzles}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Final Score: ${
				currentPuzzleID == numPuzzles
					? puzzles.reduce((sum, p)=>(sum.finalGuessCount||sum) + p.finalGuessCount) / numPuzzles
					: '-'
			}`	
		)

	// always recreate this because both DOM and puzzles might have changed
	selChallenge
		.select("#challenge-puzzles")
		.style('height', `${17 + (5+52+2+2)*(challenge.puzzles[0].maxGuesses)}px`) // TODO: this assumes no puzzles have more guesses than the first puzzle
		.selectAll('div.puzzle-container')  // NYT Wordle calls this 'div#game div#board-container div#board'
		// .data(puzzles) // make a puzzle element for each puzzle in this challenge
		.data(puzzles, puzzle => puzzle.ID)
		.join(
			enter => {
				const selContainer = enter.append('div').attr('class', 'puzzle-container')
				selContainer.append('div').attr('class', 'puzzle-score')
				selContainer.append('div').attr('class', 'puzzle')
					.style('grid-template-rows', puzzle => `repeat(${puzzle.maxGuesses}, 1fr)`)
				selContainer
					.style('left', puzzle => `${360 + 360*(puzzle.ID - currentPuzzleID)}px`)
					return selContainer
			},
			old => old,
			exit => exit
				.transition().duration(2*beat).style('left','translate(-300%)').delay(beat/2)
				.on('end', function () {this.parentElement.remove()}), // remove the parent puzzle-container
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.transition().duration(2*beat).style('left', puzzle => `${30 + 360*(puzzle.ID - currentPuzzleID)}px`).delay(beat/2)
		// TODO: the 30 and 360 are hard-coded, should be computed from game width
	selChallenge
		.selectAll('div.puzzle-score').html(puzzle => 
			`Puzzle #${puzzle.ID+1}`
			+ `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Score: ${puzzle.finished ? puzzle.finalGuessCount : puzzle.cursorPos.guessRow}/${puzzle.maxGuesses}`
		)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update 6 or 7 guess rows
	selChallenge.selectAll('div.puzzle').each(function (puzzle) { // can't use => notation because we need 'this' to get set
		//this is called for each div.puzzle DOM element
		//puzzleState (puzzle)
		d3.select(this).selectAll('div.game-row') // NYT Wordle calls this 'game-row.row'
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
				d3.select(this).selectAll('div.game-tile div.tile') // NYT Wordle calls this 'game-tile div.tile'
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

	// overkill update all hints here so they show even on exiting DOM elements.  Optimize later
	selChallenge.select("#challenge-puzzles").selectAll('div.game-tile div.tile')
		.text(tile => tile.letter)
		.attr('hint', tile => tile.hint)

}
