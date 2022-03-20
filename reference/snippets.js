// better use of binary string for btoa()
ntobsa = (n) => {
    let bsa = []; bsa.unshift( n % 256)
    n = Math.floor(n/256)
    bsa.unshift(n%256)
    n = Math.floor(n/256)
    bsa.unshift(n%256)
    return bsa
}

ntobs = (a) => String.fromCharCode(...ntobsa(n))
