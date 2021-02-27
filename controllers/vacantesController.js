const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");


const multer = require('multer');
const shortid = require('shortid');

exports.formNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    usuario: req.user,
    imagen: req.user.imagen,
    cerrarSesion: true,
    tagline: "Llena el formulario y publica tu vacante",
  });
};


exports.agregarVacante = async (req, res) => {

  const vacante = new Vacante(req.body);

  vacante.autor = req.user._id;
  vacante.skills = req.body.skills.split(',');

  const nuevaVacante = await vacante.save();

  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

exports.mostrarVacante = async (req, res, next) => {

  const vacante = await Vacante.findOne({ url: req.params.url }).populate('autor').lean();



  if (!vacante) return next();

  res.render('vacante', {
    vacante,
    nombrePagina: vacante.titulo,
    barra: true

  });

}


exports.formEditarVacante = async (req, res, next) => {

  const vacante = await Vacante.findOne({ url: req.params.url }).lean();

  if (!vacante) return next();

  res.render('editar-vacante', {
    usuario: req.user,
    imagen: req.user.imagen,
    cerrarSesion: true,
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`
  });

}


exports.editarVacante = async (req, res, next) => {

  const vacanteActualizada = req.body;

  vacanteActualizada.skills = req.body.skills.split(',');

  const vacante = await Vacante.findOneAndUpdate(
    { url: req.params.url },
    vacanteActualizada,
    {
      new: true,
      runValidator: true
    });

  res.redirect(`/vacantes/${vacante.url}`);

}



exports.validarVacante = (req, res, next) => {


  req.sanitizeBody('titulo').escape();
  req.sanitizeBody('empresa').escape();
  req.sanitizeBody('ubicacion').escape();
  req.sanitizeBody('salario').escape();
  req.sanitizeBody('contrato').escape();
  req.sanitizeBody('skills').escape();

  //validar 
  req.checkBody('titulo', 'Agrega un titulo a la vacante').notEmpty();
  req.checkBody('empresa', 'Agrega una empresa a la vacante').notEmpty();
  req.checkBody('ubicacion', 'Agrega una ubicación a la vacante').notEmpty();
  req.checkBody('contrato', 'Selecciona el tipo de contrato').notEmpty();
  req.checkBody('skills', 'Agrega almenos una habilidad').notEmpty();
  req.checkBody('descripcion', 'Agrega una descripción sustanciosa').notEmpty();


  const errores = req.validationErrors();

  if (errores) {

    req.flash('error', errores.map(error => error.msg));

    res.render('nueva-vacante', {
      nombrePagina: 'Nueva Vacante',
      tagline: 'Llena el formulario y publica tu vacante',
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash()

    })
  }
  next();


}


exports.EliminarVacante = async (req, res) => {

  const { id } = req.params;

  const vacante = await Vacante.findById(id);


  if (verificarAutor(vacante, req.user)) {
    console.log('Es el mismo');
    vacante.remove();
    res.status(200).send('Vacante eliminada Correctamente');

  } else {
    console.log('No es el mismo el mismo');
    res.status(403).send('Error de credenciales.');

  }

}

const verificarAutor = (vacante = {}, usuario = {}) => {

  if (!vacante.autor.equals(usuario._id)) {
    return false

  }

  return true;

}


const configuracionMulter = {

  limits: { fileSize: 200000 },
  storage: fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + '../../public/uploads/cv')

    },
    filename: (req, file, cb) => {

      const extension = file.mimetype.split('/')[1];

      cb(null, `${shortid.generate()}.${extension}`)
    }

  }),
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf') {

      cb(null, true);
    } else {
      cb(new Error('ERROR - Formato de documento no Válido, Solo PDF'), false);

    }
  },

};

exports.subirCV = (req, res, next) => {

  upload(req, res, function (error) {

    if (error) {

      if (error instanceof multer.MulterError) {

        if (error.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'El archivo es muy grande, máximo 200 Kilobytes');
        } else {
          req.flash('error', error.message);
        }

      } else {

        req.flash('error', error.message);
      }
      res.redirect('back');
      return;

    } else {
      return next();
    }

  });
}

const upload = multer(configuracionMulter).single('cv');

exports.contactar = async (req, res, next) => {

  const vacante = await Vacante.findOne({ url: req.params.url });

  if (!vacante) return next();



  const nuevoCandidato = {

    nombre: req.body.nombre,
    email: req.body.email,
    cv: req.file.filename

  }

  vacante.candidatos.push(nuevoCandidato);
  


  await vacante.save();

  req.flash('correcto', 'Su curriculum se envió correctamente');
  res.redirect('/');


}

exports.mostrarCandidatos = async (req, res, next) => {



  const vacante = await Vacante.findById(req.params.id).lean();

  
  if (vacante.autor != req.user._id.toString()) {
    console.log('Epale, pa onde')

  }

  if (!vacante) return next();

  res.render('candidatos', {
    nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos

  })


}

exports.buscarVacantes = async (req, res) => {

  const vacantes = await Vacante.find({

    $text: {
      $search: req.body.q

    }
  }).lean();

  res.render('home', {
    nombrePagina: `Resultados para la busqueda: ${req.body.q}`,
    barra: true,
    vacantes

  });

}