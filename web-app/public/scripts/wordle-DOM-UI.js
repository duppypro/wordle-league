'use strict'
///////////////////////// WORDLE UI FUNCTIONS //////////////////
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
	let selPuzzles = selChallenge.select("#challenge-puzzles").selectAll('div.puzzle-container div.puzzle')  // NYT Wordle calls this 'div#game div#board-container div#board'
		// .data(puzzles) // make a puzzle element for each puzzle in this challenge
		.data([puzzles[currentPuzzleID]], d => d.ID) // show only current puzzle
		.join(
			enter => enter
				.append('div').attr('class', 'puzzle-container').append('div').attr('class', 'puzzle')
				.style('height', sharedStartWordMode ? '510px' : '440px') // create puzzle boards that are new to the array allPuzzles
				.style('transform','translate(400px)')
				.transition().duration(340).style('transform','translate(0px)').delay(670),
			old => {old.each((p)=>console.log('old puzzle', currentPuzzleID, ' : ', p)); return old},
			exit => exit
				.transition().duration(340).style('transform','translate(-400px)').delay(340)
				.on('end', function () {this.parentElement.remove()}), // remove the parent puzzle-container
		)
		/* update old and new together here, the .join() merges first 2 sets, not the exit set */
		.html(puzzle => 
			`Puzzle #${puzzle.ID+1}`
			+ `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Score: ${puzzle.finished ? puzzle.finalGuessCount : puzzle.cursorPos.guessRow}/${puzzle.maxGuesses}`
		)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update 6 or 7 guess rows
	selPuzzles.each((puzzle, i, nodes) => { //this is called for each div.puzzle DOM element
		//puzzleState (puzzle)
		d3.select(nodes[i]).selectAll('div.game-row') // NYT Wordle calls this 'game-row.row'
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join(
				enter => enter // this is called once for every element in puzzle.allGuesses array that does not have a matching DOM yet
					.append('div').attr('class','game-row')
					.append('div').attr('class','row'),
				old => old, // this
				exit => exit,
				)
			// now for all entered and old guess rows create letters
			.each((guessRow, i, nodes) => {
				d3.select(nodes[i]).selectAll('div.game-tile div.tile') // NYT Wordle calls this 'game-tile div.tile'
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
