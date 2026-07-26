const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();

// Permitir peticiones desde cualquier origen (CORS)
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN CON TU ACCESS TOKEN REAL DE PRODUCCIÓN
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-7786937264103968-072610-5366195d7cc0d58a9572c3ca4d054bdb-1503693840' 
});

// Memoria temporal para guardar los pedidos
let orders = [];

// Endpoint para crear la preferencia de pago y registrar el pedido
app.post('/create_preference', async (req, res) => {
  try {
    const { items, customer } = req.body;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map(item => ({
          title: item.title,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
          currency_id: 'UYU'
        })),
        payer: {
          name: customer.name,
          phone: { number: customer.phone },
          address: { street_name: customer.address }
        },
        back_urls: {
          success: 'https://mijardinorganico.com/exito',
          failure: 'https://mijardinorganico.com/error',
          pending: 'https://mijardinorganico.com/pendiente'
        },
        auto_return: 'approved'
      }
    });

    // Guardar la orden de compra
    const newOrder = {
      id: 'ORD-' + Date.now(),
      date: new Date().toLocaleString('es-UY'),
      customer: customer,
      items: items,
      total: items.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0),
      status: 'Pendiente de Pago / Procesando'
    };

    orders.unshift(newOrder); // Agregar al inicio de la lista

    res.json({ id: result.id, orderId: newOrder.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para consultar el historial de pedidos
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Puerto dinámico asignado por Render
const PORT = process.env.PORT || 3000;
