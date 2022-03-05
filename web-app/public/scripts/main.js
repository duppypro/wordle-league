// play Wordle competitevly with a forced random first guess

// TODO: offer choice of word set. Defaulting to original
let possibleSolutionWords = newShuffledSet(WORDLE_SET_FROM.OG.possibleSolutionWords)
let allValidWords = possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)
let forcedFirstGuess = true // only handle this case for now
let numPuzzlesInChallenge = 7 // TODO: enable 7 or 30 and defining set of players in Challenge, eventually allow sets of team
let solutionByGame = []
let firstGuessByGame = [];
[possibleSolutionWords, solutionByGame] = removeRandomSubset(possibleSolutionWords, numPuzzlesInChallenge)
if (forcedFirstGuess) {
	[possibleSolutionWords, firstGuessByGame] = removeRandomSubset(possibleSolutionWords, numPuzzlesInChallenge)
}
// possibleSolutionWords now has solutionByGame and firstGuessByGame removed and is no longer needed. delete it to avoid errors
possibleSolutionWords.splice(0)

d3.select("#wordle-game").append('div').html('firstGuessByGame: ' + firstGuessByGame)
d3.select("#wordle-game").append('div').html('solutionByGame: ' + solutionByGame)

