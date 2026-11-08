# pix-qrcode

Biblioteca pequena para montar um Pix copia e cola estático no formato BR Code, calcular o CRC16 e exibir o conteúdo em QR Code. A pasta também contém uma demonstração em HTML que atualiza a prévia enquanto os dados são digitados.

## Demonstração

Abra `index.html` em um navegador moderno. A biblioteca de QR Code usada na página está incluída em `vendor/`, então a demonstração não depende de um serviço de terceiros nem envia os dados digitados pela rede.

## Uso no navegador

Carregue uma biblioteca compatível com `QRCode.js` antes de `pix-qrcode.js`:

```html
<script src="vendor/qrcode.min.js"></script>
<script src="pix-qrcode.js"></script>
<script>
  const dados = {
    key: "sua-chave-pix",
    amount: "49,90",
    name: "Loja Exemplo",
    city: "SAO PAULO",
  };

  const payload = PixQRCode.generatePixPayload(dados);
  const resultado = PixQRCode.renderPixQRCode(
    document.getElementById("qr-code"),
    dados,
    { width: 256, height: 256 },
  );

  console.log(payload === resultado.payload);
</script>
```

`amount` é opcional. Sem valor, o Pix permite que o pagador informe quanto deseja enviar. A cidade tem padrão `SAO PAULO` e pode ser trocada. O nome tem limite de 25 bytes, a cidade de 15 bytes e a chave Pix de 77 bytes.

## Uso em Node.js

```js
const PixQRCode = require("./pix-qrcode.js");

const payload = PixQRCode.generatePixPayload({
  key: "sua-chave-pix",
  amount: "49,90",
  name: "Loja Exemplo",
  city: "SAO PAULO",
});

console.log(payload);
```

Para renderizar o QR Code fora da demonstração, passe uma implementação compatível com `QRCode.js` em `options.QRCode` para `renderPixQRCode`. A função `crc16(texto)` retorna quatro dígitos hexadecimais em maiúsculas.

## API

- `generatePixPayload({ key, amount?, name, city? })` devolve o BR Code completo com o campo CRC16.
- `crc16(text)` calcula CRC16-CCITT com polinômio `0x1021` e valor inicial `0xFFFF`.
- `renderPixQRCode(elemento, dados, opcoes?)` gera o payload e exibe o QR Code no elemento informado. Retorna `{ payload, instance }`. As opções aceitas são `width`, `height` (inteiros de 64 a 1024), `colorDark`, `colorLight` (hexadecimal), `correctLevel` (`L`, `M`, `Q` ou `H`), `QRCode` (construtor alternativo) e `ariaLabel`.

O payload é estático. Esta biblioteca não processa pagamentos, não consulta a chave no DICT e não cria cobranças dinâmicas. O nome e a cidade informados são os valores incluídos no código; confirme-os com os dados da chave recebedora antes de compartilhar.

O arquivo `vendor/qrcode.min.js` é QRCode.js, distribuído sob licença MIT; o texto da licença está em `vendor/LICENSE.qrcodejs`.

## Referências

- [Manual de Padrões para Iniciação do Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) — campos do BR Code e CRC16.
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — renderização local do QR Code.
