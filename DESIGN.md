# Design da demonstração

- **Superfície:** página utilitária de uma tela, em português do Brasil, com formulário à esquerda e prévia do QR Code à direita.
- **Cores:** branco `#ffffff`, texto `#17221b`, verde `#087747`, bordas `#dce3de`; verde é reservado para ação e foco positivo.
- **Tipografia:** Georgia para títulos e uma pilha sans-serif do sistema para campos e controles.
- **Controles:** campos nativos com rótulos visíveis, erros associados por `aria-describedby`, foco evidente e botões com nome textual.
- **Responsividade:** duas colunas em telas largas; formulário e prévia empilhados em telas estreitas.
- **Comportamento:** atualiza localmente a cada digitação; não persiste nem transmite os dados.
