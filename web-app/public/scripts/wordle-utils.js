'use strict'
// useful global functions specific to most wordle puzzle variations

const allValidLetters = "abcdefghijklmnopqrstuvwxyz".split('')
const possibleSolutionWords = Array.from(WORDLE_SET_FROM.OG.possibleSolutionWords)
const allValidWords = WORDLE_SET_FROM.OG.possibleSolutionWords.concat(WORDLE_SET_FROM.OG.otherValidWords)

// I want IDs to be short.
// So only pick ~1000 offset patterns and start them on random indexes
// this makes ~2.7 million different challenges.
// So effectively random as in unguessable but with a manageable length ID
// each entry in randomOffsets supports 30 offsets allowing up to 31 solution words
// still able to encode numPuzzles + 32*mode into a single base64 Char
// 33 possible random offsets keeps
const randomOffsets = [
	[2069571,7332590,7042600,8045706,6773447,7406099,2414485,1475516,4109206,5040011,6001855,6347257,5130619,4825053,7412675,7614506,6708539,1183484,5144442,9982279,833087,3282036,7097119,9991065,6502414,4874638,302244,2319648,4755523,3669127],
	[2965176,4791319,2134397,9431023,5604893,2738122,1091041,5549517,5510344,1129515,3420651,7761829,5982756,1927776,9922674,8431404,9805080,398240,5790856,7060346,2184549,7099631,8229229,1177992,1735867,3600959,2028513,9612284,1287,3192272],
	[3138589,6338221,1882164,9925362,8502912,5100611,6484761,6303567,8739619,5612295,7442043,9726730,4083713,1633407,3401463,7642181,4601012,7166529,3204523,5856638,4248340,8384034,9615967,1455566,8460207,4160922,9740410,2002924,1213052,9800898],
	[6434600,7549308,9732831,8149642,4509259,3653848,4617017,3170561,2706070,4816525,1810666,4364232,6128686,8742565,6608176,434735,1765633,2293316,3909918,4179380,2292927,7442523,4064752,9527646,5707904,4165066,3453334,8785882,3668545,3694443],
	[3081473,6398861,6797722,4237283,255560,8355542,2437881,3804469,2457243,489627,423236,8732695,6413807,2585149,7557978,7021869,3079864,563154,8875547,4612401,6841374,9129430,8773824,1810889,8507366,392719,9442069,7829919,5805834,7741833],
	[9427921,5861578,5648939,6911444,6925458,245458,2231346,1379481,1669422,9926086,6063580,7859448,942312,1835043,2484145,1145305,849603,8430996,9286958,134793,492783,3882645,8391811,4331859,8002507,3202805,7114937,6267183,7657335,2934166],
	[1823790,9071844,9031944,2339124,8836103,5331411,8055489,1587263,2414002,2743697,6292807,1729305,9407139,7347906,3158015,653157,7956106,3985243,5235438,1360455,2754859,5681091,5377998,3088379,8126208,307662,4875465,1582919,1870272,7438826],
	[2180331,4722911,7762281,370653,8220784,1336035,811986,5805316,817894,8565910,5478518,4387996,7572887,5921006,655339,928109,7830366,2279819,4358504,9395553,2202916,9632458,8866780,4760181,9145386,8831183,3368024,2128227,533428,3843880],
	[2747969,6628521,7271324,9118347,496231,8062960,7915874,8810834,1751765,9220260,8224608,9908493,3698339,8858585,3806464,9549234,1404447,302169,3326895,4075949,7881798,5019505,739330,3261687,9974965,695672,3065394,8356663,9699025,82488],
	[8721703,7699596,6133157,2511185,1696020,5908564,1561058,8892835,2319529,1219440,3419563,6209633,2671199,3136875,9240380,2945921,6545056,2289783,7240221,3190109,3345284,3610315,5020111,3822793,8148674,8428668,1966408,3540306,8381011,5200413],
	[8479779,1561321,2782522,5788234,3881539,7253061,5100387,1898992,8394134,2353237,1835512,8983830,5929122,2101238,4178768,610064,661858,5871152,6543128,8435728,9298675,1157114,6844536,8645622,7626672,673934,4794375,6875299,7989101,5265650],
	[1638577,3837960,3142439,194401,533570,3262414,6487363,6213577,5499398,4850222,8155493,4452904,9194633,6260798,715349,4349065,9616552,8032588,9283066,1216434,1550584,5803674,4180466,9280989,5503741,6883829,3998281,1822752,1419085,2230465],
	[4839308,6400074,9859622,9564539,4298056,6140865,330209,5714609,1480841,7680043,3347439,5569678,7853862,9036141,4626155,9458339,3992143,9323990,2139888,5857683,7680112,9089271,6284063,4858738,6343846,5826512,7154007,1531983,7336316,9874208],
	[2732937,6516522,3446144,5293197,1295874,1941158,1682647,8898558,6051847,9244616,4665976,8714056,4325771,3845089,2461331,6681538,8380778,6638790,2249495,5054644,3406350,8937454,4437661,9989629,1042012,771670,698135,2165959,5379552,5569323],
	[3876483,7857878,2092648,9505254,9918622,8523413,4123511,4222700,3271178,362571,2171896,6994616,9019188,293461,183383,8423737,4330006,5091892,1894864,7407862,7731192,8141241,934939,510872,2947656,2566230,9064278,8564727,2389521,3691206],
	[1701110,6782616,5276374,4371115,1478070,997785,5251011,7483182,9974425,667612,6840249,1358499,2995719,3694471,2995719,4436196,8310320,5561847,3364473,7023400,6546448,1739763,1955940,2576278,9912753,5023411,5064840,5242982,2803143,6320673],
	[6590452,1643104,6866073,8773371,2522611,2116723,1548978,5465602,5447077,4888507,167006,3033284,1036243,8290670,6312170,3816529,8788882,5962182,1266150,6954784,3040553,2606782,6588111,3698061,4717139,5731410,312316,4654114,2136429,292504],
	[2340871,4842673,6742052,8157075,8418745,9122315,8967809,6227011,1941302,6512812,3556639,4390966,2840910,8135055,2994435,2620252,1442425,6438321,3047300,595015,5187085,8502449,7585683,7480786,6294729,6966520,4228090,4940596,2290198,3003599],
	[7905556,5740668,382042,8052858,546959,3004826,5665451,3669099,5726731,4012766,2560337,8293467,4374073,7685555,7258249,4016494,8324919,5669057,9960938,6552424,4132929,4198218,6141271,4576517,7059125,2657694,5385664,1370659,357561,625282],
	[5463783,8732761,9875262,8845851,2398134,767937,9492902,3319800,2326190,4235355,2050421,994723,9460801,5443572,9679499,9633992,378965,760342,9414254,4395336,7607693,923004,7920534,6678299,1495187,6684937,2600586,6241089,4008445,9760575],
	[5784562,4260895,4952760,639634,6062673,9810252,7406500,7878634,3760002,7488571,160239,7032203,1109263,7861386,5726458,5459908,5081083,8704825,2394506,6126189,7314515,6090792,5422328,9428912,6661337,9997795,4379296,835973,6937932,3730120],
	[6188760,8927294,1765237,4232786,4519169,9393687,6685068,6010019,2812299,4570141,7987681,6011006,335303,2112024,6853959,7047922,5064302,6950801,6869227,7806746,9634594,2845997,4392370,8736213,4627,8454188,6750858,7595660,522343,4363626],
	[8119756,3770357,4237152,3131649,6335415,3670205,245400,6018753,507632,8297912,4820797,3160347,8268815,2077732,9448369,3868070,6910393,1255932,6924574,1702510,9621083,737849,7935519,1619139,7394664,4247413,1463866,1742420,9279843,5091492],
	[6924356,5640447,2401293,5066473,6166047,2313406,386683,1541041,1767061,3008634,956093,6775270,6093312,5123324,4012249,6993827,2301696,5795818,386882,6148545,9584488,130836,3307066,6231872,8221223,2726993,5832887,7518656,5508627,6830316],
	[9111047,1851631,5263316,3952249,407504,2717564,4869033,3655084,1966734,2360152,381875,7710522,64002,5889732,6487833,6480689,4019940,6002263,5865642,2768771,6671518,4976503,8598226,2886261,1834482,3566481,511929,1950793,3321154,5304847],
	[9949887,9346916,337962,1333130,6826630,5692677,1517644,7676684,106155,7442714,4017165,2660470,4288710,3722730,6873764,6590691,3857175,7383424,3124576,7114905,7925937,9331629,9836523,450862,5044382,2921794,6130532,8650424,4075128,147678],
	[4732477,3625867,4478904,6345477,5805406,7775857,7610954,5055494,3382262,794210,5900476,1367277,8357688,3567231,7817111,7994532,6041325,37721,8146723,9334073,4558873,7475214,7454311,3617086,9700474,2689032,6762325,8096145,5310673,7414960],
	[6711431,1941453,4993353,1223512,499671,8088425,3523013,4367109,9911613,6956416,2422576,1968885,6086273,4066776,111335,1043683,4366353,9464134,1042448,753384,381706,239051,4172579,5111917,1147539,4910348,682446,5334067,4348701,1993853],
	[4571768,2929159,2738421,7678323,8139843,1763854,3335969,5670690,5573339,8568135,2275865,4158714,7392882,7623061,4935101,2198190,5050899,7434946,1591282,8471873,884229,182151,1895259,9043448,9092091,6124916,3378815,5535179,8048341,5352222],
	[7746748,7748153,8276719,6625469,2885365,577448,3064984,4241670,782391,6758398,7563326,918177,1538519,9860046,9643309,42766,1490862,8599548,9651348,3006049,3244687,3534999,3385698,6100314,6361748,1620465,6567737,9692428,2255372,2997059],
	[4288487,1976395,5028076,2304872,6790449,4185882,305033,3657236,5741233,9089639,4511920,2411350,6467405,545547,5963133,5496648,8472923,5725799,4193236,4947839,6387762,1625980,4731196,3566005,2725440,1160204,3390961,2780934,9114408,3674107],
	[1110891,8151020,8181952,9505267,4043476,8830723,5471147,92514,442257,5451073,8138008,6371949,3553602,4323381,491236,3930691,5314407,1230018,294675,3258113,4172822,2633326,4418930,5330457,6214631,7128492,4484270,6040223,5835425,8447788],
	[4278956,9152214,8534021,3601112,5780643,7564623,9289914,4989896,7329342,7784265,7709004,1738971,6602825,2821657,2303905,7827304,8151534,2666272,4341253,7605645,6731685,8270528,4219982,8296100,7226099,1414364,8419810,6098509,454146,4940808],
]

const encodeChallengeIDToVersionA = (challenge) => {
	let {
		numPuzzles,
		sharedStartWordMode,
		solutionStartIndex,
		solutionOffsetsIndex,
	} = challenge
	let version = 'A'
	
	let b = base64Alphabet[(sharedStartWordMode?1:0) * 32 + numPuzzles]
	b = b + ('00000' + (solutionOffsetsIndex * 3000 + solutionStartIndex)).slice(-5)

	return version + encodeToURLSafeBase64(b)
}
const encodeChallengeID = encodeChallengeIDToVersionA

const decodeChallengeID = (possibleID) => {
	const c = {}
	let scratch
	let num

	if (!possibleID || !possibleID.length) {
		return {} // reject
	}

	const version = possibleID[0] // first character is version of challenge ID encoding
	if (version == 'A') {
		// decode format version 'A' a.k.a. safeForURLBase64Alphabet[0] 
		if (possibleID.length != 9) {
			return c // reject if wrong length
		}
		// possibleID[0] = 'A' a.k.a. safeForURLBase64Alphabet[0] 
		// possibleID[1]..[8] = base64 encoded
		//     [1]..[8] decodes to 6 chars
		//     first char: base64Alphabet[sharedStartWordMode * 32 + numPuzzles]
		//     2nd..6th chars are offsetsIndex * 3000 + startIndex
		//     Allows 99999 / 3000 = 33 different offsetsIndex
		// possibleID[1] = numPuzzles
		// possibleID[1] = numPuzzles

		scratch = decodeFromURLSafeBase64(possibleID.slice(1))
		num = base64Alphabet.indexOf(scratch[0])
		if (num >= 32) {
			num -= 32
			c.sharedStartWordMode = true
		} else {
			c.sharedStartWordMode = false
		}
		c.numPuzzles = num
		
		scratch = 0 + scratch.slice(1)
		c.solutionStartIndex = scratch % 3000
		c.solutionOffsetsIndex = Math.floor(scratch / 3000)
	} else {
		// do not know how to decode this version
		console.warn('Unrecognized chalengeID version in URL', possibleID)
	}

	return c
}

class WordleChallenge {
// 
	constructor(possibleID) {
		// make a default challenge object to be overwritten by values coded in possibleID
		this.numPuzzles = 5
		this.sharedStartWordMode = false // this mode does not make sense until I code hard mode and harder mode
		
		// pick indexes for the random words
		this.solutionStartIndex = randomIndex(possibleSolutionWords.length)
		this.solutionOffsetsIndex = randomIndex(randomOffsets.length)
			
		this.startWordStartIndex = randomIndex(possibleSolutionWords.length - this.numPuzzles)
		this.startWordOffsetsIndex = randomIndex(randomOffsets.length)
		
		// now overwrite with values including ID encoded in possibleID if any
		const savedChallengeEntries = decodeChallengeID(possibleID) || {}
		// if possibleID was invalid then this loop won't execute, this will be untouched
		for (const [key, value] of Object.entries(savedChallengeEntries)) {
			this[key] = value
		}
		
		this.ID = encodeChallengeID(this)
			
		// now construct rest of challenge object derivable from existing entries
		this.nowPuzzleID = 0
		this.keyboardHints = {}

		this.solutionOffsets = randomOffsets[this.solutionOffsetsIndex].slice(0,this.numPuzzles-1)
			.map((n) => this.solutionStartIndex + n)
		this.solutionIndexes = [this.solutionStartIndex, ...this.solutionOffsets]
		this.startWordOffsets = randomOffsets[this.startWordOffsetsIndex].slice(0,this.numPuzzles-1)
			.map((n) => this.startWordStartIndex + n)
		this.startWordIndexes = [this.startWordStartIndex, ...this.startWordOffsets]
		this.solutionByID = removeSubsetAtIndexes(possibleSolutionWords, this.solutionIndexes),
		this.startWordByID = this.sharedStartWordMode
			? removeSubsetAtIndexes(possibleSolutionWords, this.startWordIndexes)
			: []

		this.puzzles = new Array(this.numPuzzles).fill(true).map((x_, i) => {
			// init new single puzzle state
			// TODO: refactor this into new WordlePuzzle(ID)
			const puzzle = {
				ID: i, // ID puzzles as 0..(numPuzzles-1)
				startWord: this.startWordByID[i],
				allGuesses: new Array(6).fill(true).map( // 6 rows/guesses
					(x,i) => new Array(5).fill(true).map( // of 5 letter/hint objects in each row/guess
						(x, i) => ({letter: '', hint: 'empty'})
						)
						),
				maxGuesses: undefined,
				cursorPos: {guessRow:0, letterCol: this.sharedStartWordMode ? 5 : 0},
				// cursorPos.letterCol == 0 is waiting for the first letterCol of the guess, == 4 is waiting for the fifth letter
				// cursorPos.letterCol == 5 means you have entered 5 letters but not pressed 'Enter' or 'Backspace' yet
				solution: this.solutionByID[i],
				finished: false,
				finalGuessCount: undefined,
			}
			
			if (this.sharedStartWordMode) {
				// put a random start word as the first guess
				puzzle.allGuesses = [
					new Array(5).fill(true).map((x, i) => ({letter: puzzle.startWord[i], hint: 'tbd'})),
					...puzzle.allGuesses,
				]
				// get an extras guess when forced to use a shared start word
			}
			puzzle.maxGuesses = puzzle.allGuesses.length // convenience variable
			puzzle.finalGuessCount = puzzle.maxGuesses + 2 // default to failure which is max guesses + 2
			
			return puzzle
		})
	}
}

const assignHint = (tiles, hint) => {
	// set the hint property of all tiles to hint parameter
	tiles.forEach(tile => tile.hint = hint)
}

const assignHintsFromSolution = (tiles, solution, kbdHints) => {
// primary purpose is to assign hint values
// also returns false if the guess was invalid 

	// first check if its a valid word
	const guessAsString = tiles.map((tile) => tile.letter).join('')
	if (allValidWords.indexOf(guessAsString) == -1) {
		assignHint(tiles, 'invalid')
		return false
		// return false indicates it was hinted as invalid and puzzle should not advance to next guess/row
	}

	const testSolution = solution.slice().split('') // make a copy as an array of letters so they can be marked/removed
	// we don't want to mark or modify the original solution
	// mark correct letters first and mark/remove them from solution so double letter hinting works
	tiles.forEach((tile, i) => {
		if (tile.letter == testSolution[i]) { // if in the same position
			tile.hint = 'correct'
			kbdHints[tile.letter] = 'correct'
			testSolution[i] = '.' // mark/remove this to make double letters work
		}
	})

	// now assign absent and present and remove hinted presents as we go so they only get marked again if there is more than one
	tiles.forEach((tile, i) => {
		if (tile.hint == 'tbd' || tile.hint == 'empty') { // only if it hasn't been marked yet
			const pos = testSolution.indexOf(tile.letter)
			if (pos == -1) { // if not found
				tile.hint = 'absent'
				kbdHints[tile.letter] = 'absent'
			} else {
				tile.hint = 'present'
				kbdHints[tile.letter] = 'present'
				testSolution[pos] = '.' // mark/remove this to make double letters work
			}
		}
	})

	return true
	// return true means guess was a valid word and puzzle should advance to next guess or record a win
}

//	TODO: refactor this into a method on Challenge
const updateChallengeFromKey = (challenge, key_) => {
	// convenience renaming
	let {
		puzzles,
		nowPuzzleID: ID,
		numPuzzles,
		sharedStartWordMode,
	} = challenge
	const key = (key_ == '←') ? 'backspace' : key_.toLowerCase() // normalize input key_
	const puzzle = puzzles[ID]
	let {
		guessRow: row,
		letterCol: col,
	} = puzzle.cursorPos
	const tiles = puzzle.allGuesses[row]
	// a tile is a letter+hint object. plural tiles is one word/guess of 5 tiles 
	if (ID < numPuzzles) { // if challenge isn't finished with all puzzles
		if (col == tiles.length && key == 'enter') { // only process Enter key at end of row
			const valid = assignHintsFromSolution(tiles, puzzle.solution, challenge.keyboardHints)
			const guessAsString = tiles.map(t => t.letter).join('')
			if (guessAsString == puzzle.solution) {
				puzzle.finished = true // does anything read this?
				row++
				puzzle.finalGuessCount = row
				ID = ID + 1
				if (ID < numPuzzles) {
					puzzles[ID].cursorPos = {
						guessRow:0,
						letterCol: sharedStartWordMode ? 5 : 0,
					}
				}
				// win animation here, for now it just fills the remaining rows and nothing happens if no rows left
				let winRow = row
				while (winRow < puzzle.maxGuesses) {
					assignHint(puzzle.allGuesses[winRow], 'correct')
					winRow++
				}
				// reset keyboard hints
				challenge.keyboardHints = {}
				// allValidLetters.split('').forEach(letter => challenge.keyboardHints[letter] = 'tbd' )
			} else if (valid) { // normal case
				if (row < puzzle.maxGuesses - 1) {
					row++
					col = 0
				} else { // this was last guess
					puzzle.finished = true // does anything read this?
					row++
					puzzle.finalGuessCount = row + 1 // 1 guess penalty for loss
					ID = ID + 1
					if (ID < numPuzzles) {
						puzzles[ID].cursorPos = { // update here because only puzzles[old ID] gets updated at end of function
							guessRow:0,
							letterCol: sharedStartWordMode ? 5 : 0,
						}
					}
					// reset keyboard hints
					challenge.keyboardHints = {}
				}
			} // ignore 'Enter' if guess is not valid, wait for 'Backspace'
		} else if (col > 0 && (key == 'backspace' || key == '←')) {
			col--
			tiles[col].letter = ''
			assignHint(tiles, 'tbd') // overkill = clears the invalid guess case
		} else if (col < tiles.length
				&& allValidLetters.indexOf(key.toLowerCase()) != -1) {
			tiles[col].letter = key
			col++
		}
	}
	// re-assign primitives that could have changed before returning
	challenge.nowPuzzleID = ID
	puzzle.cursorPos = {guessRow: row, letterCol: col,} // this updates the puzzles[old ID]. if ID has advanced must update above
}
