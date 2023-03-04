const Category = require('../model/category');

function seedCategory(title, parentId, parentTitle) {
	try {
		return new Category({ title, parent: { parentId, parentTitle } });
	} catch (error) {
		console.log(error);
		return error;
	}
}

module.exports = async function () {
	console.log(`seeding categories...`);
	console.log(await Category.deleteMany({}));
	for (element of Categories) {
		const category = seedCategory(element.parent);
		await category.save();
		for (child of element.children) {
			if (child.parent) {
				const parentCh = seedCategory(child.parent, category._id, category.title);
				await parentCh.save();
				child.children.forEach(async ch => {
					const chh = seedCategory(ch, parentCh._id, parentCh.title);
					await chh.save();
				});
			} else {
				const ch = seedCategory(child, category._id, category.title);
				await ch.save();
			}
		}
	}
};

const Categories = [
	{
		parent: 'Mobiles, tablets & Accessories',
		children: [
			'Mobiles',
			'Tablets',
			'earphones',
			'Cases & Covers',
			'Power Banks & Chargers',
			'Cables'
		]
	},
	{
		parent: 'Computers & Accessories',
		children: [
			'Laptops',
			'Desktop & Monitors',
			'Drives & Storage',
			'Networking Devices',
			'Keyboards & Mice',
			'Graphic Cards',
			'Printers & Accessories',
			'headphones',
			'Speakers'
		]
	},
	{
		parent: 'Furniture',
		children: [
			{
				parent: 'Home',
				children: [
					'Home Décor',
					'Bedding & Linen',
					'Bath Accessories',
					'Storage & Organisation',
					'Household Supplies',
					'Garden & Outdoors'
				]
			},
			{
				parent: 'Office',
				children: [
					'Tools & Home Improvement',
					'All Tools & Home Improvement',
					'Power Tools',
					'Hand Tools',
					'Lighting',
					'Tools Accessories'
				]
			}
		]
	},
	{
		parent: 'Electronics',
		children: ['Cameras', 'TVS']
	},
	{
		parent: 'Fashion',
		children: [
			{
				parent: `Man's Fashion`,
				children: ['Clothing', 'Watches', 'Sportswear', 'Accessories']
			},
			{
				parent: `Woman's Fashion`,
				children: [
					'Clothing',
					'Jewelry',
					'Sportswear',
					'Lingerie & Sleepwear',
					'Wearables',
					'Perfumes'
				]
			},
			`Kids's Fashion`,
			{
				parent: `Bags, Shoes & More`,
				children: ['Shoes', 'Bags & Wallets', 'Eyewear', 'Sports Shoes', 'Travel Bags & Backpacks']
			}
		]
	},
	{
		parent: 'Beauty',
		children: [`Make-up`, `Skin Care`, `Men's Grooming`, `Luxury Beauty`]
	},
	{
		parent: 'Health & Personal Care',
		children: [
			'All Health & Personal Care',
			'Personal Care Appliances',
			'Hair Care & Styling',
			'Bath & Body',
			'Dental Care'
		]
	},
	{
		parent: 'Kitchen & Appliances',
		children: [
			'Kitchen & Dining',
			'Cookware',
			'Bakeware',
			'Tableware',
			'Containers & Storage',
			'Kitchen Accessories',
			'Appliances',
			'Kitchen & Home Appliances',
			'Large Appliances',
			'Coffee Makers',
			'Blenders & Juicers',
			'Vacuums',
			'Refrigerators',
			'Washing Machines'
		]
	},
	{
		parent: 'Sports, Fitness & Outdoors',
		children: [
			'All Sports, Fitness & Outdoors',
			'Cardio Equipment',
			'Strength & Weight Equipment',
			'Fitness Technology',
			'Sports Apparel & Equipment',
			'Sports Supplements'
		]
	},
	{
		parent: 'Toys, Games & baby',
		children: [
			'All Baby Products',
			'Diapers',
			'Baby Care',
			'Travel Gear',
			'Nursing & Feeding',
			'Baby Fashion',
			'Nursery Furniture',
			'Toys & Games',
			'Outdoor Play',
			'Action Figures',
			'Dolls & Accessories',
			'Construction Toys'
		]
	}
];