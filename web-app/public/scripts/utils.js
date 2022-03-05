const newShuffledSet = source => {
	// Use Fisher–Yates shuffle but not in place - into a new Array
	let shuffled = Array.from(source) // make a copy assuming elements are simple strings
	// NOTE: Array.from() also handles any errors if source is not an array
	for (let j, i = shuffled.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1))
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] // swap in place
	}
	return shuffled
}

const randomIndex = length => Math.floor(Math.random() * length) // return integer between 0, length-1 inclusive
// only called in here so not checking parameters

const simplePickRandomSubset = (source, subsetLength) => {
	// does not modify source, returns new Array of length subsetLength
	// DEPRECATED
	const subset = []
	const sourceLength = subsetLength && subsetLength > 0 && source && source.length
	if (sourceLength) { // ensure subsetLength and source are valid
		for (let i = 0; i < subsetLength; i++) {
			subset[i] = source[randomIndex(sourceLength)]
			// NOTE: no explicit protection for duplicates
		}
	}
	return subset
}

const removeRandomSubset = (source, subsetLength, testIndex = -1) => {
	// NOTE: source will *not* be modified
  // returns 2 Arrays, the remainderby removing subset and a new array of length subsetLength will be returned
	// assumes source is shuffled
	let remainder = Array.from(source)

	let startWordIndex = testIndex >=0 ? testIndex : randomIndex(remainder.length)
	// extend source array to handle possible wrap around of subset
  let overrun = startWordIndex + subsetLength - remainder.length
	if (overrun > 0) {
    remainder = remainder.concat(remainder.splice(0,overrun)) // move just enough first words to the end
    startWordIndex -= overrun // back up the startWordIndex
	}
	let subset = remainder.splice(startWordIndex, subsetLength) // splice removes the subset from remainder

  return [ remainder, subset ]
}