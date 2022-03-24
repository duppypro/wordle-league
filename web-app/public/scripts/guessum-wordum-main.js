'use strict'
// Wordum League
// play Wordum competitevly, get ranked, share/flex your Wordum rank

//////////////////////////// LEAGUE VIEW /////////////////////
// a league is a set of users and/or teams playing multiple challenges

// init state for league
let userID = 'this-session' // no user login yet

//////////////////////// CHALLENGE ///////////////////////////////////////
// init challenge state. A challenge is a set of 5 (or n) puzzles with pre-selected order

// retrieve challenge ID from URL
let urlParams = new URLSearchParams(window.location.search)
const challengeIDFromURL = urlParams.get('ID')

// create new challenge
const challenge = new WordumChallenge(challengeIDFromURL)
// if this is a new Challenge, save it to the address bar
if (challenge.ID != challengeIDFromURL) { // if challenge was created with new ID
	urlParams.set('ID', challenge.ID) // replace with new ID
	window.location.search = `ID=${challenge.ID}` // post to the address bar, this will also reload the page
	throw new Error('page should have reloaded, how did we get here?')
}

// draw the initial state
// names ending in `Sel` are D3js selection objects
const gameSel = d3.select('#guessum-wordum-app')
drawNewGame(gameSel, challenge) // TODO: make this a class, use new WordumUI or new WordumDOM?a  

// define event listeners
const updateGameOnKeydown = (e) => {
	const key = e && e.key
	if (key) {
		updateGame(challenge, key) // updates state only
		redrawGame(gameSel, challenge) // updates UI only
	}
}

const updateGameOnMousedown = (e) => {
	const element = e && e.toElement
	const key = element && element.getAttribute('click-action')
	// TODO: don't rely on innerText, should retrieve a button unique id
	// then would not have to rely on filtering on tagName 'BUTTON'
	if (key) {
		updateGame(challenge, key) // updates state only
		redrawGame(gameSel, challenge) // updates UI only
	}
}

// attach event listeners
d3.select('body').on('keydown', updateGameOnKeydown)
gameSel.on('mousedown', updateGameOnMousedown)
// event listeners drive the game by calling update and redraw from here on
