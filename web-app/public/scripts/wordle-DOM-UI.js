'use strict'
///////////////////////// WORDLE UI FUNCTIONS //////////////////
const updateDOMFromChallenge = (selChallenge, challenge) => {
	// convenience renaming
	let {puzzles, currentPuzzleID, numPuzzles, sharedStartWordMode} = challenge // TODO: refactor globals like sharedStartWordMode and others?

	// Update progress and final score
	selChallenge.select('#challenge-score')
		.html(
			`Challenge Progress: ${currentPuzzleID}/${numPuzzles}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Final Score (avg. guesses): ${
				currentPuzzleID == numPuzzles
					? puzzles.reduce((sum, p)=>(sum.finalGuessCount||sum) + p.finalGuessCount) / numPuzzles
					: '-'
			}`	
		)

	// always recreate this because both DOM and puzzles might have changed
	let selPuzzles = selChallenge.select("#challenge-puzzles").selectAll('div.puzzle')  // NYT Wordle calls this 'div#game div#board-container div#board'
		.data(puzzles) // make a puzzle element for each puzzle in this challenge
		.join(
			enter => enter
				.append('div').attr('class', 'puzzle-container')
				.append('div').attr('class', 'puzzle')
				.style('height', sharedStartWordMode ? '510px' : '440px'), // create puzzle boards that are new to the array allPuzzles
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
	selPuzzles.each((puzzle, i, nodes) => { //this is called for each div.puzzle DOM element
		//puzzleState (puzzle)
		d3.select(nodes[i]).selectAll('div.game-row') // NYT Wordle calls this 'game-row.row'
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join(
				enter => enter // this is called once for every element in puzzle.allGuesses array that does not have a matching DOM yet
					.append('div').attr('class','game-row')
					.append('div').attr('class','row'),
				old => old, // this
				exit => exit
					.transition().duration(340).style('opacity',0).remove()
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
					exit => exit
						.transition().duration(340).style('opacity',0).remove()
				)
				// update all here because .join() returns merge of enter() and old()
				.text(tile => tile.letter)
				.attr('hint', tile => tile.hint)
				// .style('background-color', tile => hintColor[tile.hint]) // d3js.style() does not accept an object anymore
			})
	}) // end selPuzzles.each()
}
