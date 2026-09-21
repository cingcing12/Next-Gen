import Category from '../models/Category.js';
import { systemEvents } from '../events/systemEvents.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const categoryExists = await Category.findOne({ name });
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const category = await Category.create({ name, subcategories: subcategories || [] });
    systemEvents.emit('category_updated', category);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (category) {
      category.name = name || category.name;
      category.subcategories = subcategories || category.subcategories;
      const updatedCategory = await category.save();
      systemEvents.emit('category_updated', updatedCategory);
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (category) {
      await Category.deleteOne({ _id: category._id });
      systemEvents.emit('category_updated', { _id: category._id, deleted: true });
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
