// helper functions that aren't necessarily wordle specific

const randomIndex = length => Math.floor(Math.random() * length) // return integer between 0, length-1 inclusive

const removeRandomSubset = (source, numWords) => {
	// NOTE: this modifies the source Array
	const subset = []

	for (let i = 0; i < numWords; i++) {
		subset.push(source.splice(randomIndex(source.length),1)[0])
		// splice(i,1) removes element i from the source and returns an array of length 1
		//push the first (and only) element of that array onto subset
	}
	return subset
}