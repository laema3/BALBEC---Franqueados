import { Order } from '../types.js';
import { formatCurrency, formatDate } from './formatters.js';

export function printOrderReceipt(order: Order, type: 'totem' | 'online' = 'online') {
  const printWindow = window.open('', '_blank', 'width=400,height=650');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir o comprovante térmico.');
    return;
  }

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Comprovante Pedido #${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #000;
          margin: 0;
          padding: 10px;
          background: #fff;
          width: 80mm;
        }
        .ticket {
          margin-bottom: 25px;
          border-bottom: 2px dashed #000;
          padding-bottom: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .header h1 {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 4px 0;
        }
        .header p {
          font-size: 11px;
          margin: 2px 0;
        }
        .badge {
          display: inline-block;
          border: 1px solid #000;
          padding: 2px 6px;
          font-weight: bold;
          font-size: 11px;
          margin: 5px 0;
          text-transform: uppercase;
        }
        .info {
          margin: 8px 0;
          font-size: 11px;
        }
        .info div {
          margin: 2px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        th, td {
          text-align: left;
          font-size: 11px;
          padding: 3px 0;
        }
        th {
          border-bottom: 1px solid #000;
        }
        .total {
          text-align: right;
          font-weight: bold;
          font-size: 13px;
          margin-top: 6px;
          border-top: 1px solid #000;
          padding-top: 4px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 10px;
        }
        .cut-line {
          text-align: center;
          font-weight: bold;
          margin: 15px 0;
          font-size: 10px;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <!-- VIA 1: CLIENTE -->
      <div class="ticket">
        <div class="header">
          <h1>BALBEC SALGADOS</h1>
          <p>Central de Distribuição de Salgados</p>
          <div class="badge">VIA DO CLIENTE (${type === 'totem' ? 'TOTEM KIOSK' : 'ONLINE'})</div>
          <p>Pedido #${order.orderNumber}</p>
        </div>

        <div class="info">
          <div><strong>Data:</strong> ${formatDate(order.createdAt)}</div>
          <div><strong>Franqueado / Cliente:</strong> ${order.franchiseeName}</div>
          <div><strong>Doc:</strong> ${order.franchiseeDocument}</div>
          <div><strong>Retirada estimada:</strong> ${order.estimatedPickupTime}</div>
          <div><strong>Pagamento:</strong> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Qtd x Item</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td>${item.quantity}x ${item.productName} <span style="font-size:9px">(${item.internalCode})</span></td>
                <td style="text-align:right;">${formatCurrency(item.subtotal)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="total">
          TOTAL: ${formatCurrency(order.total)}
        </div>

        <div class="footer">
          <p>Obrigado pela preferência!</p>
          <p>Guarde este comprovante para retirada.</p>
        </div>
      </div>

      <div class="cut-line">----------------- CORTAR AQUI -----------------</div>

      <!-- VIA 2: CONTROLE INTERNO / COZINHA -->
      <div class="ticket" style="border-bottom: none;">
        <div class="header">
          <h1>BALBEC SALGADOS</h1>
          <p>Sistema Operacional de Franquias</p>
          <div class="badge">VIA CONTROLE INTERNO / COZINHA</div>
          <p>Pedido #${order.orderNumber} (${type === 'totem' ? 'TOTEM' : 'ONLINE'})</p>
        </div>

        <div class="info">
          <div><strong>Data/Hora:</strong> ${formatDate(order.createdAt)}</div>
          <div><strong>Franqueado:</strong> ${order.franchiseeName}</div>
          <div><strong>Fone:</strong> ${order.franchiseePhone}</div>
          <div><strong>Status:</strong> ${order.orderStatus}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Qtd x Item (Cód)</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td style="font-weight: bold; font-size: 13px;">[ ] ${item.quantity}x ${item.productName} (${item.internalCode})</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="total" style="text-align:left;">
          VALOR TOTAL: ${formatCurrency(order.total)} | PG: ${order.paymentMethod.toUpperCase()}
        </div>

        <div class="footer">
          <p>Conferência de Separação de Estoque e Expedição</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}
