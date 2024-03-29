import { unlink } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import _ from 'lodash';
import logger from '../middleware/logger.js';
import mongoose, { Types } from 'mongoose';
import slug from 'mongoose-slug-updater';
import config from 'config';
import { deleteBlob } from '../start/azure-storage.js';
mongoose.plugin(slug);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const categorySchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true, minLength: 3, maxLength: 255 },
		img: { type: String, trim: true },
		isParent: { type: Boolean, default: false },
		parent: {
			_id: false,
			parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
			parentTitle: { type: String, trim: true, minLength: 3, maxLength: 255 }
		},
		slug: { type: String, slug: ['title', 'parent.parentTitle'] }
	},
	{
		timestamps: true
	}
);
categorySchema.index({ slug: 1 }, { unique: true });

categorySchema.statics.getCategories = async function (query) {
	let { title, parentId, isParent, main, slug, pageNumber, pageSize, sort, catArr } = query;

	if (pageNumber && !pageSize) pageSize = 20;
	if (!pageNumber && pageSize) pageNumber = 1;
	let skip = (pageNumber - 1) * pageSize || 0;
	let limit = pageSize || 1000;
	sort = sort || 'title';
	let categories,
		total,
		cats = {};
	if (main) {
		categories = await Category.find({ parent: null }, {}, { skip, limit, sort }).collation({
			locale: 'en'
		});
		total = await Category.countDocuments({ parent: null });
	} else if (catArr) {
		categories = await Category.find({ parent: null }, 'title isParent parent');
		for (let i in categories) {
			const children = await Category.find({ 'parent.parentId': categories[i]._id }).select(
				'title isParent'
			);
			let arr = [];
			children.forEach(child => arr.push({ _id: child._id, title: child.title }));
			_.set(cats, categories[i].title, arr);
			arr = [];
		}
		categories = cats;
		total = await Category.countDocuments();
	} else if (title) {
		title = new RegExp(title.replace('-', ' '), 'i');
		categories = await Category.find({ title }, {}, { skip, limit, sort }).collation({
			locale: 'en'
		});
		total = await Category.countDocuments({ title });
	} else if (parentId) {
		categories = await Category.find(
			{ 'parent.parentId': parentId },
			{},
			{ skip, limit, sort }
		).collation({ locale: 'en' });
		total = await Category.countDocuments({ 'parent.parentId': parentId });
	} else if (isParent === 'true') {
		categories = await Category.find({ isParent: true }, {}, { skip, limit, sort }).collation({
			locale: 'en'
		});
		total = await Category.countDocuments({ isParent: true });
	} else if (isParent === 'false') {
		categories = await Category.find({ isParent: false }, {}, { skip, limit, sort }).collation({
			locale: 'en'
		});
		total = await Category.countDocuments({ isParent: false });
	} else if (slug) {
		slug = new RegExp(slug, 'i');
		categories = await Category.find({ slug }, {}, { skip, limit, sort }).collation({
			locale: 'en'
		});
		total = await Category.countDocuments({ slug });
	} else {
		categories = await Category.find({}, {}, { skip, limit, sort }).collation({ locale: 'en' });
		total = await Category.countDocuments();
	}
	const numberOfPages = Math.ceil(total / pageSize);
	const remaining = total - skip - limit > 0 ? total - skip - limit : 0;
	return {
		total,
		remaining,
		paginationResult: {
			currentPage: parseInt(pageNumber),
			numberOfPages,
			limit: parseInt(pageSize)
		},
		categories
	};
};

categorySchema.statics.remainingCategories = async function (
	pageNumber = 1,
	pageSize = 20,
	limit = 100
) {
	const count = await Category.countDocuments({}, { skip: pageNumber * pageSize, limit });
	return count <= 100 ? count : '+100';
};

categorySchema.statics.getCategoryById = async function (id) {
	return await Category.findById(id);
};

categorySchema.statics.getCategory = async function (slug) {
	if (Types.ObjectId.isValid(slug)) return await Category.findById(slug);
	return await Category.findOne({ slug });
};

categorySchema.statics.createCategory = async function (title, img, parentId = null) {
	if (parentId) {
		var parent = await Category.findById(parentId, 'title');
		if (!parent) return { err: true, status: 404, message: 'Parent Category not found' };
		if (!parent.isParent) {
			parent.isParent = true;
			await parent.save();
		}
	}
	const category = img
		? new Category({
				title,
				img:
					img.url?.replace(/\?.*/, '') ??
					`${process.env.SERVER_URL || 'http://localhost:5000/'}categories/${img.filename}`,
				parent: parentId ? { parentId: parent._id, parentTitle: parent.title } : null
		  })
		: new Category({
				title,
				parent: parentId ? { parentId: parent._id, parentTitle: parent.title } : null
		  });
	return { category };
};

categorySchema.statics.editCategory = async function (id, title, parentId, img) {
	let category = await Category.findById(id);
	if (!category) return { err: true, status: 404, message: 'Category not found' };
	if (title) category.title = title;
	if (img) {
		await unlink(
			`${__dirname.replace(/model/, '')}public/categories/${category.img?.replace(
				/.*categories\//,
				''
			)}`,
			err => err && err.code !== 'ENOENT' && logger.error(err.message, err)
		);
		await deleteBlob('images', category.img?.replace(/.*images\//, ''));

		category.img =
			img.url?.replace(/\?.*/, '') ??
			`${process.env.SERVER_URL || 'http://localhost:5000/'}categories/${img.filename}`;
	}
	return { category };
};

categorySchema.statics.deleteCategory = async function (id) {
	const category = await Category.findById(id);
	if (!category) return { err: true, status: 404, message: 'Category not found' };
	if (category.img)
		await unlink(
			`${__dirname.replace(/model/, '')}public/categories/${category.img.replace(
				/.*categories\//,
				''
			)}`,
			err => err && err.code !== 'ENOENT' && logger.error(err.message, err)
		);
	await deleteBlob('images', category.img?.replace(/.*images\//, ''));

	await Category.deleteOne({ _id: category._id });
	return { category };
};

const Category = mongoose.model('Category', categorySchema, 'category');
export default Category;
