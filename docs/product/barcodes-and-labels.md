# Barcodes And Labels

## Barcode Registry

Barcodes are modeled separately from items and products.

Rules:

- preserve barcode values as strings;
- preserve leading zeroes;
- prevent ambiguous active barcode resolution;
- supplier barcodes require supplier ownership;
- customer barcodes require customer ownership;
- replacements retain history;
- package levels may have separate barcodes.

## Label Architecture

Label responsibilities are separated:

1. structured label data;
2. generic label template;
3. renderer;
4. print transport;
5. print history.

Milestone 1 implements browser HTML preview, Code 128 ZPL rendering and mock print transport. Direct Zebra network printing, USB printing and Windows print bridge are deferred.

ZPL command choices were checked against Zebra documentation for `^XA`, `^FO`, `^BC`, `^FD`, `^FS` and `^XZ`.

