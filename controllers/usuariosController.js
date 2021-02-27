const mongoose = require("mongoose");
const multer = require("multer");
const Usuarios = mongoose.model("Usuarios");
const shortid = require('shortid');


const configuracionMulter = {

  limits: { fileSize: 300000 },
  storage: fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      
      cb(null, __dirname + '../../public/uploads/profiles')

    },
    filename: (req, file, cb) => {

      const extension = file.mimetype.split('/')[1];


      cb(null, `${shortid.generate()}.${extension}`)
    }

  }),
  fileFilter(req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {

      cb(null, true);
    } else {
      cb(new Error('ERROR - Formato de imagen no Válido'), false);

    }
  },

};


exports.subirImagen = (req, res, next) => {

  upload(req, res, function (error) {
    //  console.log(error);

    if (error) {
      //si se presenta un error

      if (error instanceof multer.MulterError) {
        //error de multer
        
          if(error.code=== 'LIMIT_FILE_SIZE'){
            req.flash('error','El archivo es muy grande, máximo 100 Kilobytes');

          } else {

            req.flash('error',error.message);

          }

        // return next();

      } else {
        // console.log(error.message);
        req.flash('error', error.message);

      }
      res.redirect('/administracion');
      return;

    } else {
      //si no hay error continua.
      return next();
    }



  });
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crea tu cuenta en DevJobs",
    tagline:
      "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta.",
  });
};


exports.validarRegistro = (req, res, next) => {
  //sanitizar los campos.
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  req.sanitizeBody("password").escape();
  req.sanitizeBody("confirmarPassword").escape();

  //Validar
  req.checkBody("nombre", "El nombre es obligatorio").notEmpty();
  req.checkBody("email", "El E-Mail es obligatorio").isEmail();
  req.checkBody("password", "El password es obligatorio").notEmpty();
  req.checkBody("confirmarPassword", "El Password se debe repetir").notEmpty();
  req
    .checkBody("confirmarPassword", "El Password es Diferente")
    .equals(req.body.password);

  const errores = req.validationErrors();

  if (errores) {
    //Si  existen errores
    // console.log(errores);
    //Va a recorrer todo el arreglo y lo va a asignar a flash
    req.flash("error", errores.map((error) => error.msg));

    //Se vuelve a cargar la vista con el arreglo de errores.
    res.render("crear-cuenta", {
      nombrePagina: "Crea tu cuenta en DevJobs",
      tagline: "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta.",
      mensajes: req.flash(),
    });
    return;
  }

  //Si toda la validación fue correcta
  next();

};

exports.crearUsuario = async (req, res, next) => {
  //crear usuario
  const usuario = new Usuarios(req.body);

  // console.log(usuario);


  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");

  } catch (error) {
    //la clase, y el error.
    req.flash('error', error);
    res.redirect('/crear-cuenta');

  }

};



//Form para iniciar sesión.

exports.formIniciarSesion = (req, res) => {

  res.render('iniciar-sesion', {
    nombrePagina: 'Iniciar Sesion DevJobs'

  });

}



//Form para editar perfil
exports.formEditarPerfil = (req, res) => {

  res.render('editar-perfil', {
    nombrePagina: 'Edita tu perfil en devJobs',
    usuario: req.user,
    cerrarSesion: true,
    imagen: req.user.imagen,
    usuario: req.user.toObject() //datos del usuario
  })


}
//Guardar cambios en editar perfil

exports.editarPerfil = async (req, res) => {

  const usuario = await Usuarios.findById(req.user._id);

  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;

  if (req.body.password) {
    usuario.password = req.body.password;
  }

  // console.log(req.file);

  if (req.file) {
    //Si cargaron una imagen
    usuario.imagen = req.file.filename;

  }

  await usuario.save();
  //console.log(usuario);

  req.flash('correcto', 'cambios guardados correctamente');

  res.redirect('/administracion');

}

//sanitizar y validar el formulario de editar peerfiles

exports.validarPerfil = (req, res, next) => {


  //sanitizar

  req.sanitizeBody('nombre').escape();
  req.sanitizeBody('email').escape();

  if (req.body.password) {

    req.sanitizeBody('password').escape();

  }

  //validar

  req.checkBody('nombre', 'El nombre no puede ir vacio').notEmpty();
  req.checkBody('email', 'El Correo no puede ir vacio').notEmpty();

  const errores = req.validationErrors();

  if (errores) {
    //si existen errores

    req.flash('error', errores.map(error => error.msg));
    res.render('editar-perfil', {
      nombrePagina: 'Edita tu perfil en devJobs',
      usuario: req.user,
      imagen: req.user.imagen,
      cerrarSesion: true,
      usuario: req.user.toObject() //datos del usuario
    })


  }


  next(); //Continua con elsiguiente middleware



}

