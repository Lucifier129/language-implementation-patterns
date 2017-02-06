// 判断输入字符是否为字母，即在 a-zA-Z 之间
const isLetter = char => char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z'

// 是空格或者其他分割符
const isWhiteSpace = char => char === ' ' || char === '\t' || char === '\n' || char === '\r'

// 是数字字符 0~9
const isNumber = char => char >= '0' && char <= '9'

// 检查 input 是否等于 char，value 为之前检查通过的 char 拼接起来的字符串
const createMatch = (char, length) => {
	let start = value => value === char
	let end = value => {
		if (typeof length === 'number' && value.length === length) {
			return true
		}
		return value !== char
	}
	return { start, end }
}

const createTokenizer = match => (input, start) => {
	let offset = 0
	let item = input[start + offset]
	let value = ''

	if (!match.start(item, value)) {
		return
	}

	do {
		value += item.value || item
		offset += 1
		item = input[start + offset]
		if (item === undefined) {
			break
		}
	} while (!match.end(item, value))

	return {
		value: value,
		start: start,
		end: start + offset + 1
	}
}

const patterns = {
	'DOUBLE_QUOTES_STRING': createTokenizer({
		start: char => char === '"',
		end: char => char === '"',
	}),
	'SINGLE_QUOTES_STRING': createTokenizer({
		start: char => char === '\'',
		end: char => char === '\'',
	}),
	'NAME': createTokenizer({
		start: isLetter,
		end: char => 
			!isLetter(char) &&
			!isNumber(char) &&
			char !== '_' &&
			char !== '-',
	}),
	'NUMBER': createTokenizer({
		start: isNumber,
		end: value => !isNumber(value),
	}),
	'WHITE_SPACE': createTokenizer({
		start: isWhiteSpace,
		end: value => !isWhiteSpace(value),
	}),
	'LEFT_BRACKET': createTokenizer(createMatch('(', 1)),
	'RIGHT_BRACKET': createTokenizer(createMatch(')', 1)),
	'LEFT_BRACE': createTokenizer(createMatch('{', 1)),
	'RIGHT_BRACE': createTokenizer(createMatch('}', 1)),
	'SLASH': createTokenizer(createMatch('/', 1)),
	'BACK_SLANT': createTokenizer(createMatch('\\', 1)),
	'WHIFFLETREE': createTokenizer(createMatch('-', 1)),
	'BANG': createTokenizer(createMatch('!', 1)),
	'COLON': createTokenizer(createMatch(':', 1)),
	'DOT': createTokenizer(createMatch('.', 1)),
	'POUND_KEY': createTokenizer(createMatch('#', 1)),
	'SEMICOLON': createTokenizer(createMatch(';', 1)),
	'AT_SYMBOL': createTokenizer(createMatch('@', 1)),
	'COMMA': createTokenizer(createMatch(',', 1)),
	'EQUAL_SYMBOL': createTokenizer(createMatch('=', 1)),
	'UNDERLINE': createTokenizer(createMatch('_', 1)),
	'PERSCENT_SYMBOL': createTokenizer(createMatch('%', 1)),
	'ASTERISK': createTokenizer(createMatch('*', 1)),
	'LEFT_ANGLE_BRACKET': createTokenizer(createMatch('<', 1)),
	'RIGHT_ANGLE_BRACKET': createTokenizer(createMatch('>', 1)),
	'UNKNOW': createTokenizer(() => true)
}

function getToken(input, start) {
	for (let key in patterns) {
		let tokenizer = patterns[key]
		let token = tokenizer(input, start)
		if (token) {
			return Object.assign({type: key}, token)
		}
	}
}

function tokenizer(input) {
	let index = 0
	let tokens = []
	while (index < input.length) {
		let token = getToken(input, index)
		if (!token) {
			throw new Error(`Unknow char: ${input[index]}`)
		}
		tokens.push(token)
		index = token.end
	}
	return tokens
}


let fs = require('fs')
let path = require('path')
let cssFilePath = path.join(__dirname, 'files/test.css')
let content = fs.readFileSync(cssFilePath).toString()
let tokens = tokenizer(content)

let destPath = path.join(__dirname, 'dest/05.txt')
fs.writeFileSync(destPath, JSON.stringify(tokens, null, 2))