'use strict'
///////////////////////// WORDum DRAW UI FUNCTIONS //////////////////
let beat = (60 * 1000) / 90 // 90bpm for animations speed, units are in msec
// NOTE: keep beat *not* a const because test modes may modify it

// variables ending in `Sel` are D3js selection objects
const drawNewGame = (gameSel, challenge) => {
	// Create Title and game unique ID
	gameSel.append('header')
		.html(
			`<div class="title"> GUESSum WORDum </div>`
			+ `<div class='uid'>${challenge.ID}</div>`
		)

	// Create challenge container
	gameSel.append('div').attr('id', 'challenge')

	// Create Challenge UI elements
	drawNewChallenge(gameSel.select('#challenge'), challenge)
}

const redrawGame = (gameSel, challenge) => {
	// header with title and uid does not need redrawing
	redrawChallenge(gameSel.select('#challenge'), challenge)
}

const drawNewChallenge = (challengeSel, challenge) => {
	// intended to be called once to init the UI
	// expects main to call redrawChallenge() at least once when this returns
	drawNewChallengeScore(challengeSel, challenge)
	drawNewPuzzles(challengeSel, challenge)
	drawNewKeyboard(challengeSel, challenge)
}	

const redrawChallenge = (challengeSel, challenge) => {
	redrawChallengeScore(challengeSel, challenge)
	redrawPuzzles(challengeSel, challenge)
	redrawKeyboard(challengeSel, challenge)
}

const drawNewChallengeScore = (challengeSel, challenge) => {
	challengeSel
		.append('div').attr('id', 'challenge-score')
		.selectAll('div.mini-puzzle')
		.data(challenge.puzzles, puzzle => puzzle.ID)
		.join('div').attr('class', 'mini-puzzle')
			.selectAll('div.mini-row')
			.data(puzzle =>puzzle.allGuesses)
			.join('div').attr('class', 'mini-row')
				.selectAll('div.mini-tile')
				.data(guessRow => guessRow)
				.join('div').attr('class', 'mini-tile')
					.attr('clue','tbd')
}

const redrawChallengeScore = (challengeSel, challenge) => {
	const nowPuzzle = challenge.puzzles[challenge.nowPuzzleID] // convenience rename

	challengeSel
		.select('#challenge-score')
		.selectAll('div.mini-puzzle')
		.data(challenge.puzzles, puzzle => puzzle.ID)
		.join('div').attr('class', 'mini-puzzle')
			.selectAll('div.mini-row')
			.data(puzzle =>puzzle.allGuesses)
			.join('div').attr('class', 'mini-row')
				.selectAll('div.mini-tile')
				.data(guessRow => guessRow)
				.join('div').attr('class', 'mini-tile')
					.attr('clue', tile => tile.clue)
}

const drawNewPuzzles = (challengeSel, challenge) => {
	let { // convenience renaming
		puzzles,
		nowPuzzleID,
	} = challenge

	challengeSel
		.append('div').attr('id', 'challenge-puzzles')
		.selectAll('div.puzzle')
		.data(puzzles, puzzle => puzzle.ID) // make a puzzle element for each puzzle in this challenge
		.join('div').attr('class', 'puzzle')
			// + 1 makes this start off screen, next redraw will make it slide in
			.style('left', puzzle => leftPositionFromID(puzzle.ID - nowPuzzleID + 1))
			.style('top', '0.5rem')
			.style('grid-template-rows', puzzle => `repeat(${puzzle.maxGuesses}, 1fr)`)
			.selectAll('div.row')
			.data(puzzle => puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join('div').attr('class', 'row')
				.selectAll('div.tile')
				.data(guessRow => guessRow)
				.join('div').attr('class', 'tile')
					.attr('clue','tbd')
}

const redrawPuzzles = (challengeSel, challenge) => {
	const puzzlesSel = challengeSel.select('#challenge-puzzles')
	let { // convenience renaming
		puzzles,
		nowPuzzleID,
	} = challenge

	puzzlesSel.selectAll('div.puzzle')
	.data(puzzles, puzzle => puzzle.ID)
	.filter(d => {
		return d.targetPuzzleID != nowPuzzleID
	})
	.transition()
		.each(puzzle => {
			// mark this element as on the way to its target new position
			// so the transition does not get re-started on events
			puzzle.targetPuzzleID = nowPuzzleID
		})
		.delay(() => ((nowPuzzleID > 0) ? (beat/2 + 4*beat) : 0))
		.duration(1*beat)
		.style('left', puzzle => leftPositionFromID(puzzle.ID - nowPuzzleID))

	// NOTE: enter/update/exit changed after D3 v4. Use .join(enter(), update(), exit())
	//       except update only includes elements before the enter
	//       so the pattern is more accurately: .join(enter(), old(), exit()).update()

	// for each puzzle add/update all the guess rows
	puzzlesSel.selectAll('div.puzzle').each(function (puzzle) { // can't use => notation because we need 'this' to get set
		//this is called for each div.puzzle DOM element
		d3.select(this).selectAll('div.row')
			.data(puzzle.allGuesses) // make a row element for each guessWord in this puzzle
			.join('div').attr('class', 'row')
			.each(function (guessRow) {
				d3.select(this).selectAll('div.tile')
				.data(guessRow)
				.join('div').attr('class', 'tile')
				.filter(function(tile) {
					return d3.select(this).text() != tile.letter // if letter needs changing
				})
				.text(tile => tile.letter)
				.attr('clue', tile => tile.clue)
				.transition()
				.duration(beat/4)
				.style('transform', 'scale(0.75)')
				.transition()
				.duration(beat/4)
				.style('transform', 'scale(1)')
			})
			.each(function (guessRow) {
				d3.select(this).selectAll('div.tile')
				.filter(function(tile, i, nodes) {
					return (d3.select(this).attr('clue') != tile.clue) // if clue is changing
				})
				.text(tile => tile.letter)
				.transition()
					.duration((tile, i, nodes) => (nodes[i].getAttribute('clue') == 'invalid') ? 0 : (beat/5))
					.style('transform', (tile, i) => (tile.clue == 'invalid' ? (i % 2 ? 'rotate(15deg)' : 'rotate(-15deg)') : 'rotateX(-90deg)'))
					.delay((tile, i, nodes) => (
						((tile.clue == 'invalid') || nodes[i].getAttribute('clue') == 'invalid')
							? 0
							: i * (beat/5 + beat/5))
					)
				.transition()
					.duration((tile, i, nodes) => (nodes[i].getAttribute('clue') == 'invalid') ? 0 : (beat/5))
					.style('transform', (tile, i, nodes) => (nodes[i].getAttribute('clue') == 'invalid') ? 'rotate(0deg)' : 'rotateX(0deg)')
					.attr('clue', tile => tile.clue)
			})
	})
}

const drawNewKeyboard = (challengeSel, challenge) => {
	const sel = challengeSel
		.append('div').attr('id', 'keyboard')
	let keys
	let selRow

	// top row QWERTYUIOP
	keys = Array.from("qwertyuiop")
	selRow = sel.append('div').attr('class', 'row')
	keys.forEach((key) => {
		selRow.append('button').attr('clue', 'tbd').attr('touch-event', key).text(key)
	})

	// middle row ASDFGHJKL
	keys = Array.from("asdfghjkl")
	selRow = sel.append('div').attr('class', 'row')
	selRow.append('div')
		.attr('class', 'half')
	keys.forEach((key) => {
		selRow.append('button').attr('clue', 'tbd').attr('touch-event', key).text(key)
	})
	selRow.append('div')
		.attr('class', 'half')

	// bottom row Backspace-ZXCVBNM-Enter
	keys = Array.from("zxvcbnm")
	selRow = sel.append('div').attr('class', 'row')
	selRow.append('button')
		.attr('class', 'one-and-a-half').attr('touch-event', '←').text('←')
		.style('font-size', '18px')
	keys.forEach((key) => {
		selRow.append('button').attr('clue', 'tbd').attr('touch-event', key).text(key)
	})
	selRow.append('button')
		.attr('class', 'one-and-a-half').attr('touch-event', 'Enter').text('Enter')
}

const redrawKeyboard = (challengeSel, challenge) => {
	challengeSel.select('#keyboard').selectAll('button')
		.each(function () {
			d3.select(this)
				.transition()
				.delay(4 * (beat/5 + beat/5) + beat/5 + beat/5)
				.attr('clue', challenge.keyboardClues[this.innerText.toLowerCase()])
		})
}

const leftPositionFromID = (ID) => {
	return `calc((var(--game-max-width) - var(--game-max-width)*.75)/2 + var(--game-max-width)*${ID})`
	// CONSTRAINT: this 0.75 multiplier on width is also in the .css file and must match
	// TODO: remove above CONSTRAINT
}

const emojiFromClue = (clue) => {
	const emoji = {
		correct: '🟩',
		present: '🟨',
		absent: '⬛',
		tbd: '🔳',
		invalid: '🔳',
		fail: '🟥',
		dash: '➖',
		gear: '⚙',
		chart: '📊',
		clipboard: '📋',
	}[clue || 'tbd'] || '&nbsp;'
	return emoji
}
