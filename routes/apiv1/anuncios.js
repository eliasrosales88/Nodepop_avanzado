'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Anuncio = mongoose.model('Anuncio');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' });
const fs = require("fs");
const path = require('path');


const jwtAuth = require("../../lib/jwtAuth");





router.get('/', jwtAuth(), (req, res, next) => {

  const start = parseInt(req.query.start) || 0;
  const limit = parseInt(req.query.limit) || 1000; // nuestro api devuelve max 1000 registros
  const sort = req.query.sort || '_id';
  const includeTotal = req.query.includeTotal === 'true';
  const filters = {};
  if (typeof req.query.tag !== 'undefined') {
    filters.tags = req.query.tag;
  }

  if (typeof req.query.venta !== 'undefined') {
    filters.venta = req.query.venta;
  }

  if (typeof req.query.precio !== 'undefined' && req.query.precio !== '-') {
    if (req.query.precio.indexOf('-') !== -1) {
      filters.precio = {};
      let rango = req.query.precio.split('-');
      if (rango[0] !== '') {
        filters.precio.$gte = rango[0];
      }

      if (rango[1] !== '') {
        filters.precio.$lte = rango[1];
      }
    } else {
      filters.precio = req.query.precio;
    }
  }

  if (typeof req.query.nombre !== 'undefined') {
    filters.nombre = new RegExp('^' + req.query.nombre, 'i');
  }

  Anuncio.list(filters, start, limit, sort, includeTotal, function (err, anuncios) {
    if (err) return next(err);
    res.json({ ok: true, result: anuncios });
  });
});

// Return the list of available tags
router.get('/tags', function (req, res) {
  res.json({ ok: true, allowedTags: Anuncio.allowedTags() });
});


// Post images
router.post('/', upload.single('foto'), jwtAuth(), async function (req, res, next) {
  // req.file is the `image` file
  // req.body will hold the text fields, if there were any
  try {
    const data = req.body;

    const advertTosave = {
      nombre: data.nombre,
      venta: data.venta,
      precio: data.precio,
      foto: req.file.originalname,
      tags: data.tags,
    }
    await Anuncio.createRecord(advertTosave);


    //copiamos el archivo a la carpeta definitiva de fotos
    fs.createReadStream('./uploads/' + req.file.filename)
      .pipe(fs.createWriteStream('./public/images/anuncios/' + req.file.originalname));

    //borramos el archivo temporal creado
    fs.unlink(path.join(__dirname, '../../uploads/' + req.file.filename), (err) => {
      if (err) throw err;
      console.log(req.file.filename + ' was deleted');
    });

    // respondemos
    res.json({ success: true, result: advertTosave });
  } catch (error) {
    res.json({ success: false });
  }

});


module.exports = router;
