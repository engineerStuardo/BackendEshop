const { Product } = require('../models/product');
const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jgp',
};

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('Invalid image type');

    if (isValid) {
      uploadError = null;
    }

    cb(uploadError, '/public/uploads');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(',') };
  }

  const productList = await Product.find(filter).populate('category');
  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');
  if (!product) {
    res.status(500).send('The product cannot be found!');
  }
  res.send(product);
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(404).send('Invalid Category');

  const file = req.file;
  if (!file) return res.status(404).send('No image in the request');

  const fileName = req.file.filename;
  console.log(`URL: ${req.protocol}://${req.get('host')}/public/uploads/`);
  console.log(fileName);
  // console.log(req.get('host'));
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });
  product = await product.save();
  if (!product) {
    res.status(500).send('The product cannot be created!');
  }
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send('Invalid product id');
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(404).send('Invalid Category');

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );
  if (!product) {
    res.status(404).send('The product cannot be updated!');
  }
  res.send(product);
});

router.delete('/:id', (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then(product => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: 'The product is deleted!' });
      } else {
        return res
          .status(404)
          .json({ success: false, message: 'Product not found!' });
      }
    })
    .catch(e => res.status(400).json({ success: false, error: e }));
});

router.get('/get/count', async (req, res) => {
  const productCount = await Product.countDocuments(count => count);
  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({ productCount });
});

router.get('/get/featured/:amount', async (req, res) => {
  const amount = req.params.amount ? req.params.amount : 0;
  const productsFeatured = await Product.find({ isFeatured: true }).limit(
    +amount
  );
  if (!productsFeatured) {
    res.status(500).json({ success: false });
  }
  res.send(productsFeatured);
});

router.put(
  '/gallery-images/:id',
  uploadOptions.array('images', 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).send('Invalid product id');
    }

    const files = req.files;
    const imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if (files) {
      files.map(file => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) {
      res.status(500).send('The images cannot be updated!');
    }
    res.send(product);
  }
);

module.exports = router;
