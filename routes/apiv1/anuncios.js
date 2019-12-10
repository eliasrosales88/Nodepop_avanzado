'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Anuncio = mongoose.model('Anuncio');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' });
const fs = require("fs");
const path = require('path');

const connectionPromise = require("../../lib/connectAMQP");

const queueName = "tareas";

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
      .pipe(fs.createWriteStream('./public/images/anuncios/' + req.file.filename + "_" + req.file.originalname));
          
      //borramos el archivo temporal creado
      const imageTmp = path.join(__dirname, '../../uploads/' + req.file.filename);
    
    fs.unlink(imageTmp, (err) => {
      if (err) throw err;
      console.log(req.file.filename + ' was deleted');
    });

    const imagePath = path.join(__dirname, '../../public/images/anuncios/' + req.file.filename + "_" + req.file.originalname);
    console.log('imagePath',imagePath);

    //enviamos la tarea a la cola
    main().catch(err => { console.log("Hubo un error:", err) });

    async function main() {

      // conectamos al servidor AMQP
      const conn = await connectionPromise;

      // conectar a un canal
      const channel = await conn.createChannel()  // con esto voy a hablar con las colas

      // asegurar que la cola existe
      await channel.assertQueue(queueName, {
        durable: true // la cola sobrevive a reinicios del broker
      });


      let sendAgain = true;

      try {
        // mandar un mensaje
        const image = {
          path: imagePath
        };

        // antes de mandar el siguiente mensaje verifico si debo hacerlo
        if (!sendAgain) {
          console.log("Esperando a");
          await new Promise(resolve => channel.on("drain", () => { resolve }))

        }

        sendAgain = channel.sendToQueue(queueName, Buffer.from(JSON.stringify(image)), {
          persistent: true // el mensaje sobrevive a reinicios del broker (rabbitmq es el broker).
        });

        console.log(`La ruta ${image.path} se ha enviado ${sendAgain}`);

      } catch (error) {
        console.log(error);
        process.exit(1);
      }
    }

    // respondemos
    res.json({ success: true, result: advertTosave });
  } catch (error) {
    res.json({ success: false });
  }

});


module.exports = router;
