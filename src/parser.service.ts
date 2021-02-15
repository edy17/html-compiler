
export class ParserService {

  authorizedTags: Array<string> = ['dl', 'dt', 'dd', 'ul', 'ol', 'li', 'strong'];
  W3CHierarchy: Map<string, string> = new Map([['li', 'ul,ol'], ['dt', 'dl'], ['dd', 'dl'], ['ul', 'dl']]);

  constructor() {
  }

  parse(code): { type: string, body: Array<{ type: string, value: string }> } {
    let tokens = this.lexer(code);
    return this.parser(tokens);
  }

  parser(tokens: Array<{ type: string, value: string }>): { type: string, body: Array<{ type: string, value: string }> } {
    const AST = {
      type: 'Verified Html Dom',
      body: new Array<{ type: string, value: string }>()
    };

    const tagClosingCheck = new Map<number, { tag: string, isOpening: number, isClosing: number }>();
    let i = 0;
    while (tokens.length > 0) {
      i = i + 1;
      let current_token = tokens.shift();
      if (this.authorizedTags.includes(current_token.value) && (current_token.type !== 'text')) {
        if (current_token.type === 'openingTag') {
          let block: { tag: string, isOpening: number, isClosing: number } =
            { 'tag': current_token.value, 'isOpening': 1, 'isClosing': 0 };
          if (this.W3CHierarchy.get(current_token.value)) {
            let parentTagId: number = i;
            while (parentTagId > 0) {
              parentTagId = parentTagId - 1;
              if (((tagClosingCheck.get(parentTagId))
                && (this.W3CHierarchy.get(current_token.value).includes(tagClosingCheck.get(parentTagId).tag)) &&
                (tagClosingCheck.get(parentTagId).isOpening == 1))) {
                break;
              }
            }
            if ((parentTagId > 0) && (parentTagId != i)) {
              tagClosingCheck.set(i, block);
              current_token.value = tagClosingCheck.get(parentTagId).tag + ',' + current_token.value;
              AST.body.push(current_token);
            } else {
              throw 'Violation de la hiérarchie: la balise \'' + current_token.value + '\' doit avoir une des balises \''
              + this.W3CHierarchy.get(current_token.value) + '\' comme parent.';
            }
          } else {
            tagClosingCheck.set(i, block);
            AST.body.push(current_token);
          }
        } else if (current_token.type === 'closingTag') {
          let block: { tag: string, isOpening: number, isClosing: number }
            = { 'tag': current_token.value, 'isOpening': 0, 'isClosing': 0 };
          let openingTagId: number = i;
          while (openingTagId > 0) {
            openingTagId = openingTagId - 1;
            if (((tagClosingCheck.get(openingTagId)) && (tagClosingCheck.get(openingTagId).tag == current_token.value) &&
              (tagClosingCheck.get(openingTagId).isOpening == 1))) {
              break;
            }
          }
          if ((openingTagId > 0) && (openingTagId != i)) {
            tagClosingCheck.set(openingTagId, block);
          } else {
            block.isOpening = 1;
            block.isClosing = 1;
            tagClosingCheck.set(i, block);
          }
          AST.body.push(current_token);
        }
      } else if (current_token.type === 'text') {
        let block: { tag: string, isOpening: number, isClosing: number }
          = { 'tag': current_token.type, 'isOpening': 0, 'isClosing': 0 };
        tagClosingCheck.set(i, block);
        AST.body.push(current_token);
      } else {
        throw 'le nom de balise \'' + current_token.value + '\' n\'est pas autorisé. '
        + 'Réessayez avec les balises autorisées \'dl\', \'dt\', \'dd\', \'ul\', \'ol\', \'li\' ou \'strong\'.';
      }
    }
    const isComplete: number = Array.from(tagClosingCheck.values()).reduce((sum, { tag, isOpening }) => sum + isOpening, 0);
    if (isComplete == 0) {
      return AST;
    } else {
      Array.from(tagClosingCheck.values())
        .forEach(token => {
          if ((token.isOpening == 1) && (token.isClosing == 0)) {
            throw 'Balise \'' + token.tag +
            '\' non fermée. Fermez là avec </' + token.tag + '> à la fin de son contenu.';
          } else if ((token.isOpening == 1) && (token.isClosing == 1)) {
            throw 'Balise \'' + token.tag +
            '\' non ouverte. Ouvrez là avec <' + token.tag + '> au debut de son contenu.';
          }
        });
    }
  }

  lexer(code: string): Array<{ type: string, value: string }> {
    const _tokens = code
      .split(/(<([^>]+)>)/ig);
    const tokens = new Array<{ type: string, value: string }>();
    for (let i = 0; i < _tokens.length; i++) {
      const t = _tokens[ i ];
      if (t.length <= 0 || isNaN(Number(t))) {
        if (t.startsWith('</') && t.endsWith('>')) {
          tokens.push({
            type: 'closingTag',
            value: t.replace('</', '').replace('>', '')
          });
        } else if (t.startsWith('<') && t.endsWith('>')) {
          tokens.push({
            type: 'openingTag',
            value: t.replace('<', '').replace('>', '')
          });
        } else if ((t.length > 0) && (i != 0) &&
          !_tokens[ i - 1 ].startsWith('</') &&
          !_tokens[ i - 1 ].startsWith('<') &&
          !_tokens[ i - 1 ].endsWith('>')) {
          tokens.push({ type: 'text', value: t });
        }
      }
    }

    if (tokens.length < 1) {
      throw 'Aucune balise trouvé. Inserez le contenu dans les balises autorisées '
      + '\'dl\', \'dt\', \'dd\', \'ul\', \'ol\', \'li\' ou \'strong\'.';
    }

    return tokens;
  }
}
