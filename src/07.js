const SPACE = ' '
const TAB = '\t'
const NEW_LINE = '\n'
const ZERO = '0'
const NINE = '9'
const DOT = '.'
const PLUS_SIGN = '+'
const MINUS_SIGN = '-'
const MULTIPLICATION_SIGN = '*'
const DEVISION_SIGN = '/'
const LEFT_PARENTHESE = '('
const RIGHT_PARENTHESE = ')'

const NUMBER = 0
const OPERAND = 1
const UNKNOW = 2
const PARENTHESE = 3

const GROUPING = 4

const OPERAND_ARGUMENT_MAP = {
  [PLUS_SIGN]: {
    type: NUMBER,
    count: 2
  },
  [MINUS_SIGN]: {
    type: NUMBER,
    count: 2
  },
  [MULTIPLICATION_SIGN]: {
    type: NUMBER,
    count: 2
  },
  [DEVISION_SIGN]: {
    type: NUMBER,
    count: 2
  }
}

class Character {
  constructor(value) {
    this.value = value
  }
  isWhiteSpace() {
    switch (this.value) {
      case SPACE:
      case TAB:
      case NEW_LINE:
        return true
      default:
        return false
    }
  }
  isOperand() {
    switch (this.value) {
      case PLUS_SIGN:
      case MINUS_SIGN:
      case MULTIPLICATION_SIGN:
      case DEVISION_SIGN:
        return true
      default:
        return false
    }
  }
  isDigit() {
    return this.value >= ZERO && this.value <= NINE
  }
  isDot() {
    return this.value === DOT
  }
  isLeftParenthese() {
    return this.value === LEFT_PARENTHESE
  }
  isRightParenthese() {
    return this.value === RIGHT_PARENTHESE
  }
}

class Token {
  constructor(type, startIndex) {
    this.type = type
    this.startIndex = startIndex
    this.value = ''
  }
  add(character) {
    this.value += character.value
  }
  is(type) {
    return this.type === type
  }
}

class Tokenizer {
  constructor(input, output = []) {
    this.input = input
    this.output = output
    this.index = 0
    this.character = null
  }
  isNotEnd() {
    return this.index < this.input.length
  }
  next() {
    if (this.isNotEnd()) {
      return new Character(this.input[this.index++])
    } else {
      return null
    }
  }
  consume() {
    let character = this.next()
    while (character && character.isWhiteSpace()) {
      character = this.next()
    }
    this.character = character
    return !!this.character
  }
  createToken(type) {
    return new Token(type, this.index - 1)
  }
  handleNumber() {
    let token = this.createToken(NUMBER)
    token.add(this.character)
    while (
      this.consume() &&
      (this.character.isDigit() || this.character.isDot())
    ) {
      token.add(this.character)
    }
    this.output.push(token)
  }
  handleOperand() {
    let token = this.createToken(OPERAND)
    token.add(this.character)
    this.output.push(token)
  }
  handleParenthese() {
    let token = this.createToken(PARENTHESE)
    token.add(this.character)
    this.output.push(token)
  }
  handleUnknow() {
    let token = this.createToken(UNKNOW)
    token.add(this.character)
    this.output.push(token)
  }
  execute() {
    while (this.isNotEnd()) {
      if (!this.consume()) {
        return this.output
      }

      let character = this.character

      let isDigit = character.isDigit()
      if (isDigit) {
        this.handleNumber()
        continue
      }

      let isOperand = character.isOperand()
      if (isOperand) {
        this.handleOperand()
        continue
      }

      let isParenthese =
        character.isLeftParenthese() || character.isRightParenthese()
      if (isParenthese) {
        this.handleParenthese()
        continue
      }
      this.handleUnknow()
    }

    return this.output
  }
}

class Ast {
  constructor() {
    this.type = 'Program'
    this.body = []
  }
  addNode(node) {
    this.body.push(node)
  }
}

class ExpressionStatement {
  constructor() {
    this.type = 'ExpressionStatement'
    this.operand = null
    this.arguments = []
  }
  addOperand(operand) {
    this.operand = operand
  }
  addArgument(argument) {
    this.arguments.push(argument)
  }
}

class GroupingStatement {
  constructor() {
    this.type = 'GroupingStatement'
    this.body = []
  }
  addNode(node) {
    this.body.push(node)
  }
}

class NumberLiteral {
  constructor(value) {
    this.type = 'NumberLiteral'
    this.value = value
  }
}

class OperandLiteral {
  constructor(value) {
    this.type = 'OperandLiteral'
    this.value = value
  }
}

class Parser {
  constructor(input, output = []) {
    this.input = input
    this.ast = new Ast()
    this.tokenList = new Tokenizer(this.input).execute()
    this.index = 0
    this.token = null
  }
  isNotEnd() {
    return this.index < this.input.length
  }
  next() {
    if (this.isNotEnd()) {
      return this.tokenList[this.index++]
    } else {
      null
    }
  }
  lookahead(number = 1) {
    if (this.index + number < this.tokenList.length) {
      return this.tokenList[this.index + number]
    } else {
      return null
    }
  }
  consume() {
    this.token = this.next()
    return !!this.token
  }
  consumeAndShouldNotEnding() {
    if (!this.consume()) {
      this.handleUnexpectedEnding()
    }
  }
  handleUnexpectedToken(token = this.token) {
    let beforeIndex = token.startIndex > 10 ? token.startIndex - 10 : 0
    let toIndex = token.startIndex + 10
    let before = this.input.slice(from, token.startIndex)
    let after = this.input.slice(token.startIndex, to)
    throw new Error(
      `unexpected token: ${token.value} in position ${token.startIndex}
      ${before}${token.value}${after}
      ${'^'.padLeft(token.startIndex - beforeIndex, ' ')}
      `
    )
  }
  handleUnexpectedEnding() {
    throw new Error('unexpected ending')
  }
  handleNumber(number) {
    return new NumberLiteral(number)
  }
  handleOperand() {
    return new OperandLiteral(this.token.value)
  }
  handleGrouping() {
    if (this.token.value !== LEFT_PARENTHESE) {
      this.handleUnexpectedToken()
    }
    let grouping = new GroupingStatement()

    this.consumeAndShouldNotEnding()

    while (!this.token.is(RIGHT_PARENTHESE)) {
      grouping.addNode(this.handle())
      this.consumeAndShouldNotEnding()
    }

    this.consume()
    return grouping
  }
  handleExpressionA() {
    let expression = new ExpressionStatement()

    expression.addArgument(this.handleNumber())
    this.consumeAndShouldNotEnding()
    expression.addOperand(this.handleOperand())

    this.consumeAndShouldNotEnding()
    expression.addArgument(this.handle())
    return expression
  }
  handleExpressionB() {
    let expression = new ExpressionStatement()
    expression.addArgument(this.handleNumber())
    this.consumeAndShouldNotEnding()
    expression.addOperand(this.handleOperand())

    this.consumeAndShouldNotEnding()
    expression.addArgument(this.handle())
    return expression
  }
  handleExpresssion() {
    if (!this.token.is(NUMBER)) {
      this.handleUnexpectedToken()
    }
    let expression = new ExpressionStatement()

    expression.addArgument(this.handleNumber())
    this.consumeAndShouldNotEnding()

    if (!this.token.is(OPERAND)) {
      this.handleUnexpectedToken()
    }

    expression.addOperand(this.handleOperand())

    if (!this.token.is(NUMBER)) {
      this.handleUnexpectedToken()
    }
    expression.addArgument(this.handleNumber())
    this.consume()
    return expression
  }
  handle() {
    if (this.token.is(PARENTHESE)) {
      return this.handleGrouping()
    }

    if (this.token.is(NUMBER)) {
      return this.handleExpresssion()
    }

    if (this.token.is(OPERAND)) {
      return this.handleOperand()
    }
  }
  execute() {
    while (this.isNotEnd()) {
      this.ast.addNode(this.handle())
    }
    return this.ast
  }
}

class Traverser {
  constructor(ast, visitor) {
    this.ast = ast
    this.visitor = visitor
  }
  handleArray(array, parent) {
    array.forEach(node => this.handleNode(node, parent))
  }
  handleNode(node, parent) {
    let enterMethod = `handle${node.type}Enter`
    let exitMethod = `handle${node.type}Exit`

    if (handler[enterMethod]) {
      handler[enterMethod](node, parent)
    }

    if (node instanceof ExpressionStatement) {
      this.handleArray(node.arguments, node)
    }

    if (node instanceof GroupingStatement) {
      this.handleArray(node.body, node)
    }

    if (handler[exitMethod]) {
      handler[exitMethod](node, parent)
    }
  }
  execute() {
    this.handleNode(this.ast, null)
  }
}

class Transformer {
  constructor(ast) {
    this.ast = ast
    this.output = []
    this.context = null
  }
  handleExpresssionStatementEnter(node, parent) {
    this.context = []
  }
  handleExpresssionStatementExit(node, parent) {
    this.context.push(node.operand)
    this.output.push(...this.context)
    this.context = null
  }
  handleNumberLiteralEnter(node, parent) {
    this.context.push(node.value)
  }
  handleNumberLiteralExit(node, parent) {}
  handleGroupingStatementEnter(node, parent) {
    this.context = []
  }
  handleGroupingStatementExit(node, parent) {}
}
