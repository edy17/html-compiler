export class TransformerService {

  openingBootstrapEquivalent: Map<string, string> = new Map(
    [['dl', '<div class="col-md-6">'],
      ['dl,dt', '<h3 class="h4 mb-2">'],
      ['dl,dd', '<p class="mb-4">'],
      ['dl,ul', '<ul class="list-icon mb-4">'],
      ['ol', '<ul class="list-unstyled mb-4">'],
      ['ul,li', '<li><i class="icon-check text-success"></i>'],
      ['ol,li', '<li>'],
      ['strong', '<strong>']
    ]);

  closingBootstrapEquivalent: Map<string, string> = new Map(
    [['dl', '</div>'],
      ['dt', '</h3>'],
      ['dd', '</p>'],
      ['ul', ' </ul>'],
      ['ol', ' </ul>'],
      ['ul,li', '</li>'],
      ['ol,li', '</li>'],
      ['strong', '</strong>']
    ]);


  constructor() {
  }

  transform(ast: { type: string, body: Array<{ type: string, value: string }> }): string {
    let resultHTML = '<div class="row" id="codeTranslate">';
    let tokens = Array.from(ast.body.values());
    let i = 0;
    while (tokens.length > 0) {
      i = i + 1;
      const current_token = tokens.shift();
      if ((current_token.type === 'openingTag') && this.openingBootstrapEquivalent.get(current_token.value)) {
        resultHTML = resultHTML + this.openingBootstrapEquivalent.get(current_token.value);
      } else if ((current_token.type === 'closingTag') && this.closingBootstrapEquivalent.get(current_token.value)) {
        resultHTML = resultHTML + this.closingBootstrapEquivalent.get(current_token.value);
      } else if (current_token.type === 'text') {
        resultHTML = resultHTML + current_token.value;
      }
    }
    return resultHTML + '</div>';
  }
}
