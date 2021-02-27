const mongoose = require("mongoose");
//para que las respuestas de mongo sean promises
mongoose.Promise = global.Promise;
const slug = require("slug");
const shortid = require("shortid");

const vacantesSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: "El nombre de la vacante es obligatorio",
    trim: true,
  },
  empresa: {
    type: String,
    trim: true,
  },
  ubicacion: {
    type: String,
    trim: true,
    required: "La ubicación es obligatoria",
  },
  salario: {
    type: String,
    default: 0,
    trim: true,
  },
  contrato: {
    type: String,
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    lowercase: true,
  },
  skills: [String], //arreglo de strings
  candidatos: [{
    nombre: String,
    email: String, //arreglo de objetos
    cv: String,
  }],
  autor: {
    type: mongoose.Schema.ObjectId, //Tipo de dato Mongo ID
    ref: 'Usuarios', //Colección a la que hace referencia      
    required: 'El autor es obligatorio'

  }

});

//mongoose middleware parecidos a los hooks en sequelize
//PreInsert middleware
vacantesSchema.pre("save", function (next) {
  //crear la url

  const url = slug(this.titulo);
  this.url = `${url}-${shortid.generate()}`;

  next();
});

//Crear un indice para el buscador
vacantesSchema.index({ titulo : 'text'});

module.exports = mongoose.model("Vacante", vacantesSchema);
