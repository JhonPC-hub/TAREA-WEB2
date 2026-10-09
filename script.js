// Elementos del formulario y del directorio.
const API_URL = "https://jsonplaceholder.typicode.com/users";

const formulario = document.querySelector("#formUsuario");
const campoId = document.querySelector("#idUsuario");
const campoNombre = document.querySelector("#nombreUsuario");
const campoCorreo = document.querySelector("#correoUsuario");
const campoCiudad = document.querySelector("#ciudadUsuario");
const buscador = document.querySelector("#buscarUsuario");
const tabla = document.querySelector("#tablaUsuarios");
const mensaje = document.querySelector("#mensajeEstado");
const botonGuardar = document.querySelector("#botonGuardar");
const botonCancelar = document.querySelector("#cancelarEdicion");
const totalUsuarios = document.querySelector("#totalUsuarios");
const totalCiudades = document.querySelector("#totalCiudades");
const contadorVista = document.querySelector("#contadorVista");
const estadoVacio = document.querySelector("#estadoVacio");
const tituloFormulario = document.querySelector("#tituloFormulario");

let usuarios = [];
let idEnEdicion = null;

// Mensajes y resumen del estado actual.
const mostrarMensaje = (texto, tipo = "") => {
  mensaje.textContent = texto;
  mensaje.className = `status ${tipo}`;
};

const imprimirUsuarios = () => {
  console.log("Lista completa de usuarios:", JSON.stringify(usuarios, null, 2));
};

const actualizarResumen = () => {
  totalUsuarios.textContent = usuarios.length;
  const ciudades = new Set(usuarios.map(({ ciudad }) => ciudad.toLowerCase()));
  totalCiudades.textContent = ciudades.size;
};

// Dibuja las filas a partir del arreglo recibido.
const dibujarTabla = (lista = usuarios) => {
  tabla.innerHTML = "";

  for (const usuario of lista) {
    const { id, nombre, correo, ciudad } = usuario;
    const iniciales = nombre.split(" ").filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td><span class="user-id">#${id}</span></td>
      <td><span class="user-initial">${iniciales}</span><span class="user-name">${nombre}</span></td>
      <td class="email-cell">${correo}</td>
      <td><span class="city-tag">${ciudad}</span></td>
      <td><div class="row-actions">
        <button class="action-btn" type="button" data-accion="editar" data-id="${id}">Editar</button>
        <button class="action-btn action-delete" type="button" data-accion="eliminar" data-id="${id}">Eliminar</button>
      </div></td>`;
    tabla.appendChild(fila);
  }

  estadoVacio.hidden = lista.length !== 0;
  contadorVista.textContent = `${lista.length} de ${usuarios.length} registros`;
  actualizarResumen();
};

const buscarUsuarios = () => {
  const texto = buscador.value.trim().toLocaleLowerCase("es");
  const filtrados = usuarios.filter(({ nombre }) => nombre.toLocaleLowerCase("es").includes(texto));
  dibujarTabla(filtrados);
};

// Consulta la API y adapta los datos al formato del proyecto.
const cargarUsuarios = async () => {
  mostrarMensaje("Cargando usuarios desde la API...");
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error("No se pudo consultar el servicio.");
    const datos = await respuesta.json();

    usuarios = datos.map(({ id, name, email, address }) => ({
      id,
      nombre: name,
      correo: email,
      ciudad: address.city
    }));

    dibujarTabla();
    imprimirUsuarios();
    mostrarMensaje(`Se cargaron ${usuarios.length} usuarios correctamente.`, "success");
  } catch (error) {
    mostrarMensaje("No se pudieron cargar los usuarios. Revisa tu conexión e inténtalo de nuevo.", "error");
    contadorVista.textContent = "No se pudo conectar con la API";
    console.error(error);
  }
};

const limpiarFormulario = () => {
  formulario.reset();
  campoId.disabled = false;
  idEnEdicion = null;
  botonGuardar.innerHTML = 'Agregar usuario <span aria-hidden="true">↗</span>';
  botonCancelar.hidden = true;
  tituloFormulario.innerHTML = 'Añadir<br><em>un usuario.</em>';
};

// Comprueba los campos antes de crear o actualizar un registro.
const validarCampos = () => {
  const campos = [campoId, campoNombre, campoCorreo, campoCiudad];
  for (const campo of campos) {
    if (!campo.value.trim()) {
      mostrarMensaje(`El campo "${campo.labels[0].textContent.replace("*", "").trim()}" es obligatorio.`, "error");
      campo.focus();
      return false;
    }
  }

  const id = Number(campoId.value);
  if (!Number.isInteger(id) || id < 1) {
    mostrarMensaje("El ID debe ser un número entero positivo.", "error");
    campoId.focus();
    return false;
  }

  if (!campoCorreo.value.includes("@")) {
    mostrarMensaje("Escribe un correo válido que contenga @.", "error");
    campoCorreo.focus();
    return false;
  }

  if (idEnEdicion === null && usuarios.some(usuario => usuario.id === id)) {
    mostrarMensaje(`Ya existe un usuario con el id ${id}.`, "error");
    campoId.focus();
    return false;
  }
  return true;
};

// Alta y edición sin recargar la página.
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!validarCampos()) return;

  const id = idEnEdicion === null ? Number(campoId.value) : idEnEdicion;
  const nuevoUsuario = {
    id,
    nombre: campoNombre.value.trim(),
    correo: campoCorreo.value.trim(),
    ciudad: campoCiudad.value.trim()
  };

  if (idEnEdicion !== null) {
    usuarios = usuarios.map(usuario => usuario.id === id ? nuevoUsuario : usuario);
    mostrarMensaje(`Los datos del usuario ${id} se actualizaron correctamente.`, "success");
  } else {
    usuarios = [...usuarios, nuevoUsuario];
    mostrarMensaje(`El usuario ${nuevoUsuario.nombre} se agregó correctamente.`, "success");
  }

  limpiarFormulario();
  imprimirUsuarios();
  buscarUsuarios();
});

buscador.addEventListener("input", buscarUsuarios);

// Delegación de eventos para editar y eliminar filas.
tabla.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const usuario = usuarios.find(item => item.id === id);
  if (!usuario) return;

  switch (boton.dataset.accion) {
    case "editar":
      idEnEdicion = id;
      campoId.value = usuario.id;
      campoId.disabled = true;
      campoNombre.value = usuario.nombre;
      campoCorreo.value = usuario.correo;
      campoCiudad.value = usuario.ciudad;
      botonGuardar.innerHTML = 'Guardar cambios <span aria-hidden="true">↗</span>';
      botonCancelar.hidden = false;
      tituloFormulario.innerHTML = 'Editar<br><em>usuario.</em>';
      mostrarMensaje(`Editando el registro ${id}.`, "");
      document.querySelector("#formularioSeccion").scrollIntoView({ behavior: "smooth", block: "start" });
      campoNombre.focus();
      break;
    case "eliminar":
      if (confirm(`¿Seguro que quieres eliminar a ${usuario.nombre}?`)) {
        usuarios = usuarios.filter(item => item.id !== id);
        if (idEnEdicion === id) limpiarFormulario();
        imprimirUsuarios();
        buscarUsuarios();
        mostrarMensaje(`El usuario ${usuario.nombre} fue eliminado.`, "success");
      }
      break;
  }
});

botonCancelar.addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje("Edición cancelada.", "");
});

cargarUsuarios();
