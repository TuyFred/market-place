import {
  listReviewsForProduct,
  createReview,
  listAllReviews,
  setReviewVisibility,
  deleteReview,
  toggleLike,
  getLikeStats
} from '../services/reviews.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function listProductReviewsHandler(request, reply) {
  try {
    const reviews = await listReviewsForProduct(request.params.productId);
    return sendSuccess(reply, 200, reviews);
  } catch (err) {
    return sendError(reply, err.statusCode || 500, err.message);
  }
}

export async function createReviewHandler(request, reply) {
  try {
    const review = await createReview(request.params.productId, request.body, request.user);
    return sendSuccess(reply, 201, review);
  } catch (err) {
    return sendError(reply, err.statusCode || 400, err.message);
  }
}

export async function listAllReviewsHandler(request, reply) {
  try {
    const reviews = await listAllReviews();
    return sendSuccess(reply, 200, reviews);
  } catch (err) {
    return sendError(reply, err.statusCode || 500, err.message);
  }
}

export async function setReviewVisibilityHandler(request, reply) {
  try {
    const review = await setReviewVisibility(request.params.id, request.body?.is_visible !== false);
    return sendSuccess(reply, 200, review);
  } catch (err) {
    return sendError(reply, err.statusCode || 400, err.message);
  }
}

export async function deleteReviewHandler(request, reply) {
  try {
    await deleteReview(request.params.id);
    return reply.code(204).send();
  } catch (err) {
    return sendError(reply, err.statusCode || 400, err.message);
  }
}

export async function toggleLikeHandler(request, reply) {
  try {
    const result = await toggleLike(request.params.productId, request.user.id);
    return sendSuccess(reply, 200, result);
  } catch (err) {
    return sendError(reply, err.statusCode || 400, err.message);
  }
}

export async function getLikesHandler(request, reply) {
  try {
    const userId = request.headers.authorization?.startsWith('Bearer ')
      ? null
      : null;
    // Optional auth for liked state — try soft extract
    let uid = null;
    try {
      if (request.user?.id) uid = request.user.id;
    } catch {
      /* public */
    }
    const stats = await getLikeStats(request.params.productId, uid || userId);
    return sendSuccess(reply, 200, stats);
  } catch (err) {
    return sendError(reply, err.statusCode || 500, err.message);
  }
}
