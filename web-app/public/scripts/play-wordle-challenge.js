'use strict'
// Wordle League
// play Wordle competitevly, get ranked, share/flex your Wordle rank
// Maker:
// 	https://github.com/duppypro
// Contributors:
// 	Contributors welcome
// 	request at https://github.com/duppypro/wordle-league/issues

//////////////////////////// USER + LEAGUE VIEW /////////////////////
// TODO: login a user, provide anonymous view, transition anonymous stats to OAUTH2 user when user chooses
// TODO: present all-time states to user, present list of all Challenges allow user to resume existing challenge or create/join new one
// TODO: enable create/join/leave teams (teams is what makes it a Wordle League instead of just Wordle Challenges)

// init state for league
let userID = 'this-session' // no user login yet
// init DOM for league
// League specific DOM Not implemented yet

//////////////////////// CHALLENGE ///////////////////////////////////////
// init challenge state. A challenge is a set of 5 (or n) puzzles with pre-selected order
// TODO: offer choice of word set. Defaulting to original Josh Whordle
// TODO: save state per user, currently just saves per session
// TODO: bind puzzles to fixed time periods (assume local Day)

// retrieve challenge ID from URL
let urlParams = new URLSearchParams(window.location.search)
const challengeIDFromURL = urlParams.get('ID') || urlParams.get('challengeID')
// create new challenge
const challenge = new WordleChallenge(challengeIDFromURL)
// if this is a new Challenge, save it to the address bar
if (challenge.ID != challengeIDFromURL) { // if challenge was created with new ID
	urlParams.set('challengeID', challenge.ID) // replace with new ID
	window.location.search = urlParams // post to the address bar, this will also reload the page
	throw new Error('page should have reloaded, how did we get here?')
}

// init DOM for Challenge
// names ending in `Sel` are D3js selection objects
const challengeSel = d3.select('#challenge')

// init DOM for puzzles
updateD3SelectionFromChallenge(challengeSel, challenge)
// must call this once to init presentation, then this is also called later from anything that changes puzzle state such as event handlers

const updateChallengeOnKeydown = (e) => {
	const key = e && e.key
	if (key) {
		updateChallengeFromKey(challenge, key)
		updateD3SelectionFromChallenge(challengeSel, challenge)
	}
}

const updateChallengeOnMousedown = (e) => {
	const key = e && e.toElement && e.toElement.innerText
	if (key) {
		updateChallengeFromKey(challenge, key) // updates state only
		updateD3SelectionFromChallenge(challengeSel, challenge) // updates UI only
	}
}

d3.select('body').on('keydown', updateChallengeOnKeydown)
d3.select('#keyboard').on('mousedown', updateChallengeOnMousedown)
// event listeners drive the game from here on