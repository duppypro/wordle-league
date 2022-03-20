'use strict'
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

const removeSubsetAtIndexes = (
	source, // source array is modified by removing subset words
	indexes, // an array of indexes into the source array
) => {
	const subset = [] // the words to return

	indexes.forEach((index) => {
		subset.push(source.splice(index % source.length,1)[0])
		// splice(randomI,1) removes element randomI from the source and returns an array of length 1
		// [0] grabs the first (and only) word of that array
		// .push() that word onto the return subset
	})
	return subset
}

const base64Alphabet =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split('')
const safeForURLBase64Alphabet =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-".split('')

const encodeToURLSafeBase64 = (input) => {
	return btoa(input) // uuencode input
		.split('') // cast string to array of single chars
		.map(c => safeForURLBase64Alphabet[base64Alphabet.indexOf(c)]) // translate
		.join('') // cast to string again and return this
}

const decodeFromURLSafeBase64 = (input) => {
	// validate input
	if (!input || !input.length) {
		console.warn('bad or too short string "', input, '"')
		return ''
	}
	if (input.length % 4 != 0) { // check length is multiple of 4
		console.warn('encoded input "', input, '" not multiple of 4')
		return ''
	}
	let a = input.split('') // cast string to array of single chars
	if (!a.every(c => safeForURLBase64Alphabet.indexOf(c) != -1)) { // check every char is valid
		console.warn('"', input, '" contains invalid  characters')
		return ''
	}

	a = a.map(c => base64Alphabet[safeForURLBase64Alphabet.indexOf(c)]) // translate
		.join('') // cast to string again

	return atob(a) // return the uudecoded string
}