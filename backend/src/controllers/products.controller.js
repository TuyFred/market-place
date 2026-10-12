import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../services/products.service.js';
import { getProductById } from '../services/products.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { uploadImage } from '../utils/upload.js';

export async function getProductByIdHandler(request, reply) {
  try {
    const { id } = request.params;
    const product = await getProductById(id);
    return sendSuccess(reply, 200, product);
  } catch (err) {
    const statusCode = err.statusCode || 404;
    return sendError(reply, statusCode, err.message || 'Product not found');
  }
}

export async function getProductsHandler(request, reply) {
  try {
    const products = await listProducts(request.query);
    return sendSuccess(reply, 200, products);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(reply, statusCode, err.message);
  }
}

export async function createProductHandler(request, reply) {
  try {
    const product = await createProduct(request.body);
    return sendSuccess(reply, 201, product);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function updateProductHandler(request, reply) {
  try {
    const product = await updateProduct(request.params.id, request.body);
    return sendSuccess(reply, 200, product);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function deleteProductHandler(request, reply) {
  try {
    await deleteProduct(request.params.id);
    return reply.code(204).send();
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function uploadProductImageHandler(request, reply) {
  try {
    const file = await request.file();

    if (!file) {
      return sendError(reply, 400, 'No file uploaded');
    }

    const uniqueName = `${Date.now()}-${file.filename}`;
    const imageUrl = await uploadImage(file.file, file.mimetype, uniqueName);

    const productId = request.query.productId;
    let updatedProductId = null;

    if (productId) {
      // Fetch existing product to append to its images if needed
      const product = await getProductById(productId);
      const existingUrls = Array.isArray(product.imageUrls) ? product.imageUrls : [];
      const imageUrls = [...existingUrls, imageUrl];

      const updates = {
        imageUrl: existingUrls.length === 0 ? imageUrl : product.imageUrl,
        imageUrls
      };

      const updated = await updateProduct(productId, updates);
      updatedProductId = updated.id;
    }

    return sendSuccess(reply, 200, { imageUrl, updatedProductId });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function proxyProductImageHandler(request, reply) {
  try {
    const id = request.params.id;
    const product = await getProductById(id);
    const imageUrl = product?.imageUrl || (Array.isArray(product?.imageUrls) ? product.imageUrls[0] : null);
    if (!imageUrl) return reply.code(404).send({ message: 'No image for product' });

    // fetch remote image server-side to avoid CORS issues
    const res = await fetch(imageUrl);
    if (!res.ok) return reply.code(502).send({ message: 'Failed to fetch image' });
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    reply.header('Content-Type', contentType);
    reply.header('Cache-Control', 'public, max-age=86400');
    return reply.send(Buffer.from(arrayBuffer));
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(reply, statusCode, err.message || 'Error');
  }
}

