import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/categories.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getCategoriesHandler(request, reply) {
  try {
    const categories = await listCategories();
    return sendSuccess(reply, 200, categories);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(reply, statusCode, err.message);
  }
}

export async function createCategoryHandler(request, reply) {
  try {
    const category = await createCategory(request.body);
    return sendSuccess(reply, 201, category);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function updateCategoryHandler(request, reply) {
  try {
    const category = await updateCategory(request.params.id, request.body);
    return sendSuccess(reply, 200, category);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function deleteCategoryHandler(request, reply) {
  try {
    await deleteCategory(request.params.id);
    return reply.code(204).send();
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}
