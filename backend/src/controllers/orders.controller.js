import { createOrder, listOrders, listOrdersForUser, updateOrderStatus, uploadOrderProof } from '../services/orders.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { uploadImage } from '../utils/upload.js';

export async function createOrderHandler(request, reply) {
  try {
    const order = await createOrder(request.body, request.user);
    return sendSuccess(reply, 201, order);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function getOrdersHandler(request, reply) {
  try {
    const orders = await listOrders();
    return sendSuccess(reply, 200, orders);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(reply, statusCode, err.message);
  }
}

export async function getMyOrdersHandler(request, reply) {
  try {
    const orders = await listOrdersForUser(request.user);
    return sendSuccess(reply, 200, orders);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(reply, statusCode, err.message);
  }
}

export async function updateOrderStatusHandler(request, reply) {
  try {
    const order = await updateOrderStatus(request.params.id, request.body.status);
    return sendSuccess(reply, 200, order);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function uploadProofHandler(request, reply) {
  try {
    const id = request.params.id;
    // fastify-multipart exposes file() helper
    const file = await request.file();
    if (!file) {
      return sendError(reply, 400, 'No file uploaded');
    }

    // Log uploaded file info for debugging
    request.log.info({ msg: 'Received proof upload', file: { filename: file.filename, mimetype: file.mimetype, fields: file.fields } });

    const stream = file.file; // stream.Readable
    const mimetype = file.mimetype;
    const filename = `${Date.now()}-${file.filename || 'proof'}`;

    const publicUrl = await uploadImage(stream, mimetype, filename, 'order-proofs');

    const order = await uploadOrderProof(id, publicUrl);
    return sendSuccess(reply, 200, order);
  } catch (err) {
    request.log.error({ msg: 'Error uploading proof', error: err });
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message || 'Upload failed');
  }
}
