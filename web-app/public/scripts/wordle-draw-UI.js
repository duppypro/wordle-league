'use strict'
///////////////////////// WORDLE UI FUNCTIONS //////////////////
const beat = 666 // 333 // for animations speed, units are in msec

const redrawKeyboard = (keybaordSel, challenge) => {
	keybaordSel.selectAll('button').each(function () {
		d3.select(this).attr('hint', challenge.keyboardHints[this.innerText.toLowerCase()])
	})
}

const emojiFromHint = (hint) => {
	const emoji = {
		correct: '🟩',
		present: '🟨',
		absent: '⬛',
		empty: '➖',
		tbd: '➖',
		invalid: '➖',
		fail: '🟥',
	}[hint] || '&nbsp;'
	return emoji
}

const leftPositionFromID = (ID) => {
	return `calc((var(--game-max-width) - var(--game-max-width)*.736)/2 + var(--game-max-width)*${ID})`
}

const redrawChallenge = (challengeSel, challenge) => {
	let { // convenience renaming
		puzzles,
		nowPuzzleID,
		numPuzzles,
	} = challenge

	// update keyboard
	redrawKeyboard(challengeSel.select('#challenge-keyboard'), challenge)

	// Update progress and final score
	challengeSel.select('#challenge-score')
		.selectAll('div.mini-score')
		.data(puzzles, puzzle => puzzle.ID) // make a mini-score for each puzzle in this challenge
		.join(
			enter => enter.append('div').attr('class', 'mini-score'),
			old => old,
			exit => exit,
		)
		.html((puzzle) => {
			let text = ''
			puzzle.allGuesses.forEach((guess) => {
				text = text + guess.map((tile) => emojiFromHint(tile.hint)).join('')
				text = text + '<br>'
			})
			return text
		})

	// update all the puzzles in this challenge
	challengeSel.select("#challenge-puzzles")
		.selectAll('div.puzzle-container')  // NYT Wordle calls this 'div#game div#board-container div#board'
		.data(puzzles, puzzle => puzzle.ID) // make a puzzle element for each puzzle in this challenge
		.join(
			enter => {
				const selContainer = enter.append('div').attr('class', 'puzzle-container')
				// selContainer.append('div').attr('class', 'puzzle-score')
				selContainer.append('div').attr('class', 'puzzle')
					.style('grid-template-rows', puzzle => `repeat(${puzzle.maxGuesses}, 1fr)`)
				selContainer
					.style('left', puzzle => leftPositionFromID(1 + puzzle.ID - nowPuzzleID))
					.style('top', '0.5rem')
				return selContainer
			},
			old => old,
			exit => exit,
		)
		// update old and new together here, the .join() merges first 2 sets, not the exit set
		.filter(d => {
			//only apply transitions if the target has changed
			return d.targetPuzzleID != nowPuzzleID
		})
			.transition()
				.each(d => {
					// mark this element as on the way to its target new position
					// so the transition does not get re-started on events
					d.targetPuzzleID = nowPuzzleID
				})
				.duration(1.5*beat)
				.style('left', puzzle => leftPositionFromID(puzzle.ID - nowPuzzleID))
			.delay(() => ((nowPuzzleID > 0) ? (beat/2 + 4*beat) : 0))
		// TODO: the 49.5 and 375 are hard-coded, should be computed from game width
	
	// update each puzzle's score
	challengeSel // This is not created so not used now
		.selectAll('div.puzzle-score').html(puzzle => 
			`Puzzle <bold>#${puzzle.ID+1}</bold>`
			+ `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
			+ `Score: ${puzzle.finished ? puzzle.finalGuessCount : puzzle.cursorPos.guessRow}/${puzzle.maxGuesses}`
		)
		// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
		//       except update only includes elements before the enter
		//       so the pattern is more accurately: .join(enter(),old(),exit()).update()
	
	// for each puzzle add/update all the guess rows
	challengeSel.selectAll('div.puzzle').each(function (puzzle) { // can't use => notation because we need 'this' to get set
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
						.append('div').attr('class','tile')
						.attr('hint','tbd'),
					old => old,
					exit => exit,
				)
				// update all here because .join() returns merge of enter() and old()
				.filter(function(tile,i,nodes) {
					return d3.select(this).text() != tile.letter // if letter is changing
				})
					.text(tile => tile.letter)
					.attr('hint', tile => tile.hint)
					.transition()
						.duration(beat/4)
						.style('transform','scale(0.75)')
					.transition()
						.duration(beat/4)
						.style('transform','scale(1)')
			})
			.each(function (guessRow) {
				d3.select(this).selectAll('div.game-tile div.tile')
				.filter(function(tile,i,nodes) {
					return (d3.select(this).attr('hint') != tile.hint) // if hint is changing
				})
					.text(tile => tile.letter)
					.transition()
						.duration((tile, i, nodes) => (nodes[i].getAttribute('hint') == 'invalid') ? 0 : (beat/5))
						.style('transform', tile => (tile.hint == 'invalid' ? 'rotate(-15deg)' : 'rotateX(-90deg)'))
						.delay((tile, i, nodes) => (
							((tile.hint == 'invalid') || nodes[i].getAttribute('hint') == 'invalid')
								? 0
								: i * (beat/5 + beat/5))
						)
					.transition()
						.duration((tile, i, nodes) => (nodes[i].getAttribute('hint') == 'invalid') ? 0 : (beat/5))
						.style('transform', (tile, i, nodes) => (nodes[i].getAttribute('hint') == 'invalid') ? 'rotate(0deg)' : 'rotateX(0deg)')
						.attr('hint', tile => tile.hint)
			})
	}) // end selPuzzles.each()

}

const drawNewKeyboard = (keybaordSel) => {
	const sel = keybaordSel.append('div').attr('id','keyboard')
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

const drawNewChallenge = (challengeSel, challenge) => {
	// intended to be called once to init the UI
	// calls redrawChallenge() when done

	// Create challenge board
	challengeSel.append('div').attr('id','challenge-score')
	challengeSel.append('div').attr('id','challenge-puzzles')
	challengeSel.append('div').attr('id','challenge-keyboard')

	drawNewKeyboard(challengeSel.select('#challenge-keyboard'))

	// end with the first redraw
	redrawChallenge(challengeSel, challenge)
}

const drawNewGame = (gameSel, challenge) => {
	// Create Title and game unique ID
	gameSel.append('header')
		.html(
			`<div class="title"> Wordle Challenge </div>`
			+ `<div class='uid'>ID=${challenge.ID}</div>`
		)

	// Create challenge board
	gameSel.append('div').attr('id','challenge')

	drawNewChallenge(gameSel.select('#challenge'), challenge)
}

const redrawGame = (gameSel, challenge) => {
	redrawChallenge(gameSel.select('#challenge'), challenge)
}