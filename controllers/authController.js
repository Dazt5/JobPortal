const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const Usuarios = mongoose.model("Usuarios");
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');


exports.autenticarUsuario = passport.authenticate("local", {
  successRedirect: "/administracion",
  failureRedirect: "/iniciar-sesion",
  failureFlash: true,
  badRequestMessage: "Ambos campos son obligatorios",
});

exports.cerrarSesion = (req, res) => {

  req.logout();
  req.flash('correcto', 'Cerraste sesión correctamente');


  return res.redirect('/iniciar-sesion');

}

exports.formReestablecerPassword = (req, res) => {

  res.render('reestablecer-password', {
    nombrePagina: 'Reestablece tu Password',
    tagline: 'Si ya tienes una cuenta pero olvidaste tu password coloca tú E-mail'
  });

}

exports.guardarPassword = async (req, res) => {

  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now()
    }
  });


  if (!usuario) {
    req.flash('error', 'El token no es válido, intente de nuevo');
    return res.redirect('/reestablecer-password');

  }

  usuario.password = req.body.password;

  usuario.token = undefined;
  usuario.expira = undefined;

  await usuario.save();

  req.flash('correcto','Password Modificado correctamente');
  res.redirect('/iniciar-sesion');

}

exports.enviarToken = async (req, res, next) => {

  const usuario = await Usuarios.findOne({ email: req.body.email });

  if (!usuario) {
    req.flash('error', 'El correo no está registrado')
    res.redirect('/reestablecer-password');
  }
  usuario.token = crypto.randomBytes(20).toString('hex');
  usuario.expira = Date.now() + 3600000;

  await usuario.save();

  const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

  await enviarEmail.enviar({
    usuario,
    subject: 'Password Reset',
    resetUrl,
    archivo: 'reset'
  })

  req.flash('correcto', `Instrucciones enviadas al correo ${req.body.email}`)
  res.redirect('/iniciar-sesion');

}

exports.restablecerPassword = async (req, res) => {

  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now()
    }
  });

  if (!usuario) {

    req.flash('error', 'El token no es válido, intente de nuevo');
    return res.redirect('/reestablecer-password');

  }

  res.render('nuevo-password', {
    nombrePagina: 'Nuevo Password'

  })


}

exports.verificarUsuario = (req, res, next) => {

  if (req.isAuthenticated()) {
    return next(); 

  }

  res.redirect('/iniciar-sesion');

}

exports.mostrarPanel = async (req, res) => {

  const vacantes = await Vacante.find({ autor: req.user._id }).lean();

  res.render('administracion', {
    nombrePagina: 'Panel de Administración',
    tagline: 'Crea y Administra tus Vacantes desde aquí',
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes

  })
}


