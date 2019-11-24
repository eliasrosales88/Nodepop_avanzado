'use strict';
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

class LoginApiController {
  
  async loginJWT(req, res, next) {
    try {
      // Recoge credenciales de la peticion
      const email = req.body.email;
      const password = req.body.password;
  
      // Buscar el usuario en la BBDD
      const usuario = Usuario.findOne({email: email});

      // Si no lo encontramos le decimos que no
      if (!usuario || !await bcrypt.compare(password, usuario.password)) {
        res.json({success: "no", error: res.__("Invalid credentials")});
        return;
      }

      // Creamos un JWT    (no meter una instancia de mongoose ene el Payload)
      const token = jwt.sign({_id: usuario._id }, process.env.JWT_SECRET, {
        expiresIn: "10d"
      });

      // Respondemos 
      res.json({success: true, token: token})

    } catch (error) {
      next(error);
    }
  }
}