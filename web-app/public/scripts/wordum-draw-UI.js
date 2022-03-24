'use strict'
///////////////////////// WORDum DRAW UI FUNCTIONS //////////////////
const beat = (60 * 1000) / 90 // 90bpm for animations speed, units are in msec

// variables ending in `Sel` are D3js selection objects
const drawNewGame = (gameSel, challenge) => {
	// Create Title and game unique ID
	gameSel.append('header')
		.html(
			`<div class="title"> GUESSum WORDum </div>`
			+ `<div class='uid'>ID=${challenge.ID}</div>`
		)

	// Create challenge container
	gameSel.append('div').attr('id','challenge')

	// Create Challenge UI elements
	drawNewChallenge(gameSel.select('#challenge'), challenge)
}

const redrawGame = (gameSel, challenge) => {
	// header with title and uid does not need redrawing
	redrawChallenge(gameSel.select('#challenge'), challenge)
}

const drawNewChallenge = (challengeSel, challenge) => {
	// intended to be called once to init the UI
	// calls redrawChallenge() when done

	// Create challenge board
	challengeSel.append('div').attr('id','challenge-score')
	challengeSel.append('div').attr('id','challenge-puzzles')
	challengeSel.append('div').attr('id','challenge-keyboard')

	drawNewChallengeScore(challengeSel.select('#challenge-score'), challenge)

	drawNewPuzzles(challengeSel.select('#challenge-puzzles'), challenge)

	drawNewKeyboard(challengeSel.select('#challenge-keyboard'))
}	

const redrawChallenge = (challengeSel, challenge) => {
	// Update progress and final score
	redrawChallengeScore(challengeSel.select('#challenge-score'), challenge)
	
	// update all the puzzles in this challenge
	redrawPuzzles(challengeSel.select('#challenge-puzzles'), challenge)

	// update keyboard
	redrawKeyboard(challengeSel.select('#challenge-keyboard'), challenge)
}

const drawNewChallengeScore = (challengeScoreSel, challenge) => {
	let {
		puzzles
	} = challenge

	challengeScoreSel.selectAll('div.mini-score')
		.data(puzzles, puzzle => puzzle.ID) // make a mini-score for each puzzle in this challenge
		.join(
			enter => enter.append('div').attr('class', 'mini-score'),
			old => old,
			exit => exit.remove(),
		)
}

const redrawChallengeScore = (challengeScoreSel, challenge) => {
	//
	challengeScoreSel.selectAll('div.mini-score')
		.data(challenge.puzzles, puzzle => puzzle.ID) // make a mini-score for each puzzle in this challenge
		.filter(puzzle => !puzzle.transitioning)
		.each(function(puzzle) {
			puzzle.transitioning = true;
			puzzle.miniScoreText = ''
			puzzle.allGuesses.forEach((guess) => {
				puzzle.miniScoreText = puzzle.miniScoreText + guess.map((tile) => emojiFromHint(tile.hint)).join('')
				puzzle.miniScoreText = puzzle.miniScoreText + '<br>'
			})
		})
		.transition() // Why does this not work here and it works in redrawKeyboard()????
		.delay((puzzle) => {
			if (puzzle.notFirstTime) {
				return (4 * (beat/5+beat/5) + beat/5 + beat/5) // delay until end of letter reveal
				// TODO: improve
			} else {
				puzzle.notFirstTime = true
				return 0 // don't delay draw on first call
			}
		})
		.on('end', function(puzzle) {
			d3.select(this).html(puzzle.miniScoreText)
			puzzle.transitioning = false;
		})
}

const drawNewPuzzles = (puzzlesSel, challenge) => {
	let { // convenience renaming
		puzzles,
		nowPuzzleID,
	} = challenge

	puzzlesSel.selectAll('div.puzzle-container')
	.data(puzzles, puzzle => puzzle.ID) // make a puzzle element for each puzzle in this challenge
	.join(
		enter => enter.append('div').attr('class', 'puzzle-container')
			.style('left', puzzle => leftPositionFromID(puzzle.ID - nowPuzzleID + 1)) // + 1 makes this start off screen and slide in
			.style('top', '0.5rem')
			.append('div').attr('class', 'puzzle')
				.style('grid-template-rows', puzzle => `repeat(${puzzle.maxGuesses}, 1fr)`),
		old => old,
		exit => exit.remove(),
	)
	// CONSTRAINT: the enter function above does not return the correct element.
	// If code is ever needed after the join, must make enter return the parent '.puzzle-container'
}

const redrawPuzzles = (puzzlesSel, challenge) => {
	let { // convenience renaming
		puzzles,
		nowPuzzleID,
	} = challenge

	puzzlesSel.selectAll('.puzzle-container')
	.data(puzzles, puzzle => puzzle.ID)
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

	// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(),update(),exit())
	//       except update only includes elements before the enter
	//       so the pattern is more accurately: .join(enter(),old(),exit()).update()

	// for each puzzle add/update all the guess rows
	puzzlesSel.selectAll('div.puzzle').each(function (puzzle) { // can't use => notation because we need 'this' to get set
		//this is called for each div.puzzle DOM element
		d3.select(this).selectAll('div.game-row')
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join(
				enter => enter // this is called once for every element in puzzle.allGuesses array that does not have a matching DOM yet
					.append('div').attr('class','game-row')
					.append('div').attr('class','row'),
				old => old, // this
				exit => exit.remove(),
				)
			// now for all entered and old guess rows create letters
			.each(function (guessRow) {
				d3.select(this).selectAll('div.game-tile div.tile')
				.data(guessRow)
				.join(
					enter => enter // TODO: move this to drawNewPuzzles()
						.append('div').attr('class','game-tile')
						.append('div').attr('class','tile')
						.attr('hint','tbd'),
					old => old,
					exit => exit.remove(),
				)
				// update all here because .join() returns merge of enter() and old()
				.filter(function(tile,i,nodes) {
					return d3.select(this).text() != tile.letter // if letter needs changing
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
						.style('transform', (tile, i) => (tile.hint == 'invalid' ? (i % 2 ? 'rotate(15deg)' : 'rotate(-15deg)') : 'rotateX(-90deg)'))
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
	})

}

const drawNewKeyboard = (keybaordSel) => {
	const sel = keybaordSel.append('div').attr('id','keyboard')
	let keys
	let selRow

	// top row QWERTYUIOP
	keys = Array.from("qwertyuiop")
	selRow = sel.append('div').attr('class','row')
	keys.forEach((key) => {
		selRow.append('button').attr('hint','tbd').attr('click-action', key).text(key)
	})

	// middle row ASDFGHJKL
	keys = Array.from("asdfghjkl")
	selRow = sel.append('div').attr('class','row')
	selRow.append('div')
		.attr('class','half')
	keys.forEach((key) => {
		selRow.append('button').attr('hint','tbd').attr('click-action', key).text(key)
	})
	selRow.append('div')
		.attr('class','half')

	// bottom row Enter-ZXCVBNM-Backspace
	keys = Array.from("zxvcbnm")
	selRow = sel.append('div').attr('class','row')
	selRow.append('button')
		.attr('class','one-and-a-half').attr('click-action', '←').text('←')
		.style('font-size','18px')
	keys.forEach((key) => {
		selRow.append('button').attr('hint','tbd').attr('click-action', key).text(key)
	})
	selRow.append('button')
		.attr('class','one-and-a-half').attr('click-action', 'Enter').text('Enter')
}

const redrawKeyboard = (keybaordSel, challenge) => {
	keybaordSel.selectAll('button').each(function () {
		d3.select(this)
			.transition()
			.delay(5 * (beat/5+beat/5)) // TODO: reveal one at a time as letters reveal
			.attr('hint', challenge.keyboardHints[this.innerText.toLowerCase()])
	})
}

const leftPositionFromID = (ID) => {
	return `calc((var(--game-max-width) - var(--game-max-width)*.75)/2 + var(--game-max-width)*${ID})`
	// CONSTRAINT: this 0.75 multiplier on width is also in the .css file and must match
	// TODO: remove above CONSTRAINT
}

const emojiFromHint = (hint) => {
	const emoji = {
		correct: '🟩',
		present: '🟨',
		absent: '⬛',
		// empty: '🔳', DEPRECATED
		tbd: '🔳',
		invalid: '🔳',
		fail: '🟥',
		dash: '➖',
		gear: '⚙',
		chart: '📊',
		clipboard: '📋',
	}[hint || 'empty'] || '&nbsp;'
	return emoji
}
