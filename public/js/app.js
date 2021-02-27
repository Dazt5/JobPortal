import axios from 'axios';
import Swal from 'sweetalert2';

const { set } = require("mongoose");

document.addEventListener("DOMContentLoaded", () => {

  const skills = document.querySelector(".lista-conocimientos");

  if (skills) {
    skills.addEventListener("click", agregarSkills);

    skillsSeleccionados();
  }

  let alertas = document.querySelector(".alertas");

  if (alertas) {
    limpiarAlertas();
  }

  const vacantesListado = document.querySelector('.panel-administracion');

  if (vacantesListado) {

    vacantesListado.addEventListener('click', accionesListado);

  }


});

const skills = new Set();

const agregarSkills = (e) => {

  if (e.target.tagName === "LI") {

    if (e.target.classList.contains("activo")) {

      skills.delete(e.target.textContent);

      e.target.classList.remove("activo");
    } else {

      skills.add(e.target.textContent);

      e.target.classList.add("activo");
    }
  }

  console.log(skills);

  const skillsArray = [...skills];

  document.querySelector("#skills").value = skillsArray;
};

const skillsSeleccionados = () => {
  const seleccionadas = Array.from(
    document.querySelectorAll(".lista-conocimientos .activo")
  );


  seleccionadas.forEach((seleccionada) => {

    skills.add(seleccionada.textContent);
  });

  const skillsArray = [...skills];

  document.querySelector("#skills").value = skillsArray;
};

const limpiarAlertas = () => {
  const alertas = document.querySelector(".alertas");

  const interval = setInterval(() => {

    if (alertas.children.length > 0) {

      alertas.removeChild(alertas.children[0]);

    } else if (alertas.children.length === 0) {

      alertas.parentElement.removeChild(alertas);

      clearInterval(interval);

    }
  }, 2000);
};

const accionesListado = e => {

  e.preventDefault();

  console.log(e.target);

  if (e.target.dataset.eliminar) {

    Swal.fire({
      title: '¿Quieres eliminar la vacante?',
      text: 'Una vez eliminada no se puede recuperar',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, Eliminar',
      cancelButtonText: 'No, Cancelar'

    }).then(result => {
      if (result.value) {

        const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`

        axios.delete(url, { params: { url } })
          .then(response => {

            if (response.status === 200) {
              Swal.fire(
                'Eliminada',
                response.data,
                'success');

              e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement);
            }
          }).catch(error => {

            Swal.fire({
              icon: 'error',
              title: 'Ocurrió un error',
              text: 'No existe autorización para el usuario'
            })

          })
      }
    })

  } else if (e.target.tagName === 'A') {

    window.location.href = e.target.href;

  }

}

